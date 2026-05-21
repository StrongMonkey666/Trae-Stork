#!/usr/bin/env python3
import os
import sys
import json
import time
import datetime
from typing import Dict, List, Any, TypedDict, Annotated, Sequence
import operator
import yfinance as yf
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"
MAX_DAILY_CALLS = 20
STATE_FILE = "state.json"
COUNTER_FILE = "call_counter.json"
DEFAULT_STOCK = "AAPL"

# Initialize OpenAI client for DeepSeek API
client = None
if DEEPSEEK_API_KEY:
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url=DEEPSEEK_BASE_URL
    )

# Define the state structure for LangGraph
class AgentState(TypedDict):
    steps: Annotated[List[Dict[str, Any]], operator.add]
    ticker: str
    stock_price: float
    analyst_report: str
    bull_argument: str
    bear_argument: str
    debate_summary: str
    final_decision: str
    decision_reason: str

def load_json_file(file_path: str, default: Any) -> Any:
    """Load JSON file, return default if not exists or error"""
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return default

def save_json_file(file_path: str, data: Any) -> None:
    """Save data to JSON file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def check_and_update_call_counter() -> bool:
    """Check if we've exceeded daily call limit and update counter"""
    today = datetime.date.today().isoformat()
    counter = load_json_file(COUNTER_FILE, {"date": today, "count": 0})
    
    if counter["date"] != today:
        counter = {"date": today, "count": 0}
    
    if counter["count"] >= MAX_DAILY_CALLS:
        return False
    
    counter["count"] += 1
    save_json_file(COUNTER_FILE, counter)
    return True

def add_step(state: AgentState, role: str, content: str) -> AgentState:
    """Add a step to the state"""
    timestamp = datetime.datetime.now().isoformat()
    step = {"role": role, "content": content, "timestamp": timestamp}
    state["steps"].append(step)
    
    # Persist state to file
    persist_state(state)
    return state

def persist_state(state: AgentState) -> None:
    """Persist the current state to state.json"""
    state_data = {
        "steps": state.get("steps", []),
        "last_decision": state.get("final_decision", ""),
        "latest_price": state.get("stock_price", 0.0)
    }
    save_json_file(STATE_FILE, state_data)

def get_stock_data(ticker: str) -> Dict[str, Any]:
    """Fetch stock data using yfinance with error handling"""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if hist.empty:
            return {"success": False, "error": "No data found for ticker"}
        
        latest_price = float(hist['Close'].iloc[-1])
        prices = [float(p) for p in hist['Close'].tolist()]
        dates = [d.strftime('%Y-%m-%d') for d in hist.index.tolist()]
        
        return {
            "success": True,
            "ticker": ticker,
            "latest_price": latest_price,
            "prices": prices,
            "dates": dates
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def call_deepseek_api(messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None) -> str:
    """Call DeepSeek API with error handling"""
    if not client:
        raise ValueError("DEEPSEEK_API_KEY not set")
    
    if not check_and_update_call_counter():
        raise Exception(f"Daily API call limit ({MAX_DAILY_CALLS}) exceeded")
    
    try:
        kwargs = {
            "model": DEEPSEEK_MODEL,
            "messages": messages,
            "temperature": 0.7
        }
        if tools:
            kwargs["tools"] = tools
        
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"API call failed: {str(e)}")

def market_analyst_node(state: AgentState) -> AgentState:
    """Market Analyst node: Fetch stock data and generate analysis"""
    ticker = state["ticker"]
    state = add_step(state, "system", f"开始分析股票: {ticker}")
    
    # Fetch stock data
    stock_data = get_stock_data(ticker)
    if not stock_data["success"]:
        state = add_step(state, "error", f"获取股票数据失败: {stock_data['error']}")
        return state
    
    state["stock_price"] = stock_data["latest_price"]
    state = add_step(state, "data", f"最新价格: ${stock_data['latest_price']:.2f}, 最近5天: {list(zip(stock_data['dates'], stock_data['prices']))}")
    
    # Prepare prompt for analysis
    prices_text = ", ".join([f"{d}: ${p:.2f}" for d, p in zip(stock_data['dates'], stock_data['prices'])])
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_stock_price",
                "description": "获取指定股票的当前价格",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {"type": "string", "description": "股票代码"}
                    },
                    "required": ["ticker"]
                }
            }
        }
    ]
    
    messages = [
        {"role": "system", "content": "你是一位专业的股票市场分析师。请根据提供的最近5天价格数据，生成简短的市场分析（中文，50字以内）。"},
        {"role": "user", "content": f"股票: {ticker}\n最近5天价格: {prices_text}\n\n请分析市场趋势。"}
    ]
    
    try:
        # Simulate function calling (we already have the data)
        # Add a step about tool calling
        state = add_step(state, "analyst_thought", "思考: 需要获取股票价格数据")
        state = add_step(state, "analyst_action", f"调用工具 get_stock_price({ticker})")
        state = add_step(state, "tool_response", f"返回结果: {stock_data['latest_price']:.2f}")
        
        analysis = call_deepseek_api(messages, tools)
        state["analyst_report"] = analysis
        state = add_step(state, "Market Analyst", analysis)
    except Exception as e:
        state = add_step(state, "error", f"分析师报告生成失败: {str(e)}")
    
    return state

def debate_node(state: AgentState) -> AgentState:
    """Debate node: Simulate bull and bear arguments"""
    analyst_report = state.get("analyst_report", "")
    ticker = state["ticker"]
    
    if not analyst_report:
        state = add_step(state, "error", "没有分析师报告，无法进行辩论")
        return state
    
    state = add_step(state, "system", "开始多空辩论")
    
    # Bull argument
    bull_messages = [
        {"role": "system", "content": "你是一位坚定的多头研究员。请针对以下分析师报告，用一句话阐述看涨理由（中文）。"},
        {"role": "user", "content": f"分析师报告: {analyst_report}\n股票: {ticker}"}
    ]
    
    try:
        bull_arg = call_deepseek_api(bull_messages)
        state["bull_argument"] = bull_arg
        state = add_step(state, "Bull Researcher", bull_arg)
        
        # Bear argument
        bear_messages = [
            {"role": "system", "content": "你是一位谨慎的空头研究员。请针对以下分析师报告和多头观点，用一句话阐述看跌理由（中文）。"},
            {"role": "user", "content": f"分析师报告: {analyst_report}\n多头观点: {bull_arg}\n股票: {ticker}"}
        ]
        
        bear_arg = call_deepseek_api(bear_messages)
        state["bear_argument"] = bear_arg
        state = add_step(state, "Bear Researcher", bear_arg)
        
        # Debate summary
        summary_messages = [
            {"role": "system", "content": "请根据以下多空辩论，生成简短的辩论总结（中文）。"},
            {"role": "user", "content": f"分析师报告: {analyst_report}\n多头观点: {bull_arg}\n空头观点: {bear_arg}"}
        ]
        
        summary = call_deepseek_api(summary_messages)
        state["debate_summary"] = summary
        state = add_step(state, "Debate Summary", summary)
        
    except Exception as e:
        state = add_step(state, "error", f"辩论环节失败: {str(e)}")
    
    return state

def trader_node(state: AgentState) -> AgentState:
    """Trader node: Make final trading decision"""
    debate_summary = state.get("debate_summary", "")
    ticker = state["ticker"]
    
    if not debate_summary:
        state = add_step(state, "error", "没有辩论总结，无法做出决策")
        return state
    
    state = add_step(state, "system", "开始交易决策")
    
    trader_messages = [
        {"role": "system", "content": "你是一位资深交易员。请根据以下辩论总结，给出最终交易决策：买入/卖出/持有，并附带一句理由（中文）。"},
        {"role": "user", "content": f"股票: {ticker}\n辩论总结: {debate_summary}\n\n请给出决策。"}
    ]
    
    try:
        decision_response = call_deepseek_api(trader_messages)
        
        # Extract decision (simplified parsing)
        decision = "持有"
        if "买入" in decision_response:
            decision = "买入"
        elif "卖出" in decision_response:
            decision = "卖出"
        
        state["final_decision"] = decision
        state["decision_reason"] = decision_response
        state = add_step(state, "Trader", decision_response)
        state = add_step(state, "system", f"最终决策: {decision}")
        
    except Exception as e:
        state = add_step(state, "error", f"交易决策失败: {str(e)}")
    
    return state

def create_workflow():
    """Create and return the workflow (simplified version without full LangGraph for compatibility)"""
    # Since full LangGraph might be heavy for 2GB, we use a simple sequential workflow
    def run_workflow(ticker: str) -> AgentState:
        initial_state: AgentState = {
            "steps": [],
            "ticker": ticker,
            "stock_price": 0.0,
            "analyst_report": "",
            "bull_argument": "",
            "bear_argument": "",
            "debate_summary": "",
            "final_decision": "",
            "decision_reason": ""
        }
        
        state = add_step(initial_state, "system", "启动 AI 交易团队工作流")
        
        # Execute nodes sequentially
        state = market_analyst_node(state)
        time.sleep(0.5)  # Small delay to avoid rate limits
        state = debate_node(state)
        time.sleep(0.5)
        state = trader_node(state)
        
        return state
    
    return run_workflow

def main():
    """Main function"""
    # Get ticker from command line or use default
    ticker = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_STOCK
    
    print(f"=== AI 交易团队启动 - 分析股票: {ticker} ===")
    
    # Check API key
    if not DEEPSEEK_API_KEY:
        print("错误: 请设置 DEEPSEEK_API_KEY 环境变量")
        return 1
    
    # Run workflow
    try:
        workflow = create_workflow()
        final_state = workflow(ticker)
        
        print("\n=== 工作流完成 ===")
        print(f"最终决策: {final_state.get('final_decision', 'N/A')}")
        print(f"状态已保存到: {STATE_FILE}")
        
    except Exception as e:
        print(f"\n错误: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

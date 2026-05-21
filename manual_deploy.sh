#!/bin/bash
# AI Trader 一键部署脚本（手动创建文件版）
# 适用于 Ubuntu 22.04 腾讯云服务器

set -e

echo "=========================================="
echo "  AI Trader 一键部署脚本"
echo "=========================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "工作目录: $SCRIPT_DIR"
echo ""

# 1. 创建目录
echo "[1/7] 创建目录..."
mkdir -p "$SCRIPT_DIR/.streamlit"

# 2. 创建 agent.py
echo "[2/7] 创建 agent.py..."
cat > "$SCRIPT_DIR/agent.py" << 'PYEOF'
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

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"
MAX_DAILY_CALLS = 20
STATE_FILE = "state.json"
COUNTER_FILE = "call_counter.json"
DEFAULT_STOCK = "AAPL"

client = None
if DEEPSEEK_API_KEY:
    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

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
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return default

def save_json_file(file_path: str, data: Any) -> None:
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def check_and_update_call_counter() -> bool:
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
    timestamp = datetime.datetime.now().isoformat()
    step = {"role": role, "content": content, "timestamp": timestamp}
    state["steps"].append(step)
    persist_state(state)
    return state

def persist_state(state: AgentState) -> None:
    state_data = {
        "steps": state.get("steps", []),
        "last_decision": state.get("final_decision", ""),
        "latest_price": state.get("stock_price", 0.0)
    }
    save_json_file(STATE_FILE, state_data)

def get_stock_data(ticker: str) -> Dict[str, Any]:
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if hist.empty:
            return {"success": False, "error": "No data found"}
        latest_price = float(hist['Close'].iloc[-1])
        prices = [float(p) for p in hist['Close'].tolist()]
        dates = [d.strftime('%Y-%m-%d') for d in hist.index.tolist()]
        return {"success": True, "ticker": ticker, "latest_price": latest_price, "prices": prices, "dates": dates}
    except Exception as e:
        return {"success": False, "error": str(e)}

def call_deepseek_api(messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None) -> str:
    if not client:
        raise ValueError("DEEPSEEK_API_KEY not set")
    if not check_and_update_call_counter():
        raise Exception(f"Daily API call limit ({MAX_DAILY_CALLS}) exceeded")
    try:
        kwargs = {"model": DEEPSEEK_MODEL, "messages": messages, "temperature": 0.7}
        if tools:
            kwargs["tools"] = tools
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"API call failed: {str(e)}")

def market_analyst_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    state = add_step(state, "system", f"开始分析股票: {ticker}")
    stock_data = get_stock_data(ticker)
    if not stock_data["success"]:
        state = add_step(state, "error", f"获取股票数据失败: {stock_data['error']}")
        return state
    state["stock_price"] = stock_data["latest_price"]
    state = add_step(state, "data", f"最新价格: ${stock_data['latest_price']:.2f}")
    prices_text = ", ".join([f"{d}: ${p:.2f}" for d, p in zip(stock_data['dates'], stock_data['prices'])])
    tools = [{"type": "function", "function": {"name": "get_stock_price", "description": "获取股票价格", "parameters": {"type": "object", "properties": {"ticker": {"type": "string"}}, "required": ["ticker"]}}}]
    messages = [{"role": "system", "content": "你是一位专业的股票市场分析师。请根据提供的最近5天价格数据，生成简短的市场分析（中文，50字以内）。"}, {"role": "user", "content": f"股票: {ticker}\n最近5天价格: {prices_text}\n\n请分析市场趋势。"}]
    try:
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
    analyst_report = state.get("analyst_report", "")
    ticker = state["ticker"]
    if not analyst_report:
        state = add_step(state, "error", "没有分析师报告，无法进行辩论")
        return state
    state = add_step(state, "system", "开始多空辩论")
    try:
        bull_messages = [{"role": "system", "content": "你是一位坚定的多头研究员。请针对以下分析师报告，用一句话阐述看涨理由（中文）。"}, {"role": "user", "content": f"分析师报告: {analyst_report}\n股票: {ticker}"}]
        bull_arg = call_deepseek_api(bull_messages)
        state["bull_argument"] = bull_arg
        state = add_step(state, "Bull Researcher", bull_arg)
        bear_messages = [{"role": "system", "content": "你是一位谨慎的空头研究员。请针对以下分析师报告和多头观点，用一句话阐述看跌理由（中文）。"}, {"role": "user", "content": f"分析师报告: {analyst_report}\n多头观点: {bull_arg}\n股票: {ticker}"}]
        bear_arg = call_deepseek_api(bear_messages)
        state["bear_argument"] = bear_arg
        state = add_step(state, "Bear Researcher", bear_arg)
        summary_messages = [{"role": "system", "content": "请根据以下多空辩论，生成简短的辩论总结（中文）。"}, {"role": "user", "content": f"分析师报告: {analyst_report}\n多头观点: {bull_arg}\n空头观点: {bear_arg}"}]
        summary = call_deepseek_api(summary_messages)
        state["debate_summary"] = summary
        state = add_step(state, "Debate Summary", summary)
    except Exception as e:
        state = add_step(state, "error", f"辩论环节失败: {str(e)}")
    return state

def trader_node(state: AgentState) -> AgentState:
    debate_summary = state.get("debate_summary", "")
    ticker = state["ticker"]
    if not debate_summary:
        state = add_step(state, "error", "没有辩论总结，无法做出决策")
        return state
    state = add_step(state, "system", "开始交易决策")
    trader_messages = [{"role": "system", "content": "你是一位资深交易员。请根据以下辩论总结，给出最终交易决策：买入/卖出/持有，并附带一句理由（中文）。"}, {"role": "user", "content": f"股票: {ticker}\n辩论总结: {debate_summary}\n\n请给出决策。"}]
    try:
        decision_response = call_deepseek_api(trader_messages)
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
    def run_workflow(ticker: str) -> AgentState:
        initial_state: AgentState = {"steps": [], "ticker": ticker, "stock_price": 0.0, "analyst_report": "", "bull_argument": "", "bear_argument": "", "debate_summary": "", "final_decision": "", "decision_reason": ""}
        state = add_step(initial_state, "system", "启动 AI 交易团队工作流")
        state = market_analyst_node(state)
        time.sleep(0.5)
        state = debate_node(state)
        time.sleep(0.5)
        state = trader_node(state)
        return state
    return run_workflow

def main():
    ticker = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_STOCK
    print(f"=== AI 交易团队启动 - 分析股票: {ticker} ===")
    if not DEEPSEEK_API_KEY:
        print("错误: 请设置 DEEPSEEK_API_KEY 环境变量")
        return 1
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
PYEOF

# 3. 创建 dashboard.py
echo "[3/7] 创建 dashboard.py..."
cat > "$SCRIPT_DIR/dashboard.py" << 'DASHEOF'
#!/usr/bin/env python3
import os
import json
import time
from datetime import datetime
import streamlit as st

st.set_page_config(page_title="AI 交易团队监控面板", page_icon="📈", layout="wide", initial_sidebar_state="collapsed")

st.markdown("""<style>
.stApp { background-color: #0e1117; }
.metric-card { background-color: #1e2329; padding: 20px; border-radius: 10px; border: 1px solid #30363d; }
.card-title { color: #8b949e; font-size: 14px; margin-bottom: 8px; }
.card-value { color: #f0f6fc; font-size: 28px; font-weight: bold; }
.decision-buy { color: #3fb950; }
.decision-sell { color: #f85149; }
.decision-hold { color: #d29922; }
</style>""", unsafe_allow_html=True)

STATE_FILE = "state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
    return None

def format_timestamp(ts):
    try:
        return datetime.fromisoformat(ts).strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return ts

def get_decision_class(decision):
    decision = decision or ""
    if "买入" in decision:
        return "decision-buy"
    elif "卖出" in decision:
        return "decision-sell"
    else:
        return "decision-hold"

def main():
    st.title("📈 AI 交易团队监控面板")
    col1, col2, col3 = st.columns([1, 1, 1])
    with col3:
        if st.button("🔄 手动刷新", use_container_width=True):
            st.rerun()
    st.divider()
    state = load_state()
    if not state:
        st.warning("⚠️ Agent 尚未运行，请先执行 agent.py")
        st.info("提示: 运行 `python agent.py AAPL` 来启动分析流程")
        time.sleep(5)
        st.rerun()
        return
    col1, col2 = st.columns(2)
    with col1:
        price = state.get("latest_price", 0)
        st.markdown(f"""<div class="metric-card"><div class="card-title">💵 最新股票价格</div><div class="card-value">${price:.2f}</div></div>""", unsafe_allow_html=True)
    with col2:
        decision = state.get("last_decision", "N/A")
        decision_class = get_decision_class(decision)
        st.markdown(f"""<div class="metric-card"><div class="card-title">🎯 当前交易决策</div><div class="card-value {decision_class}">{decision}</div></div>""", unsafe_allow_html=True)
    st.divider()
    steps = state.get("steps", [])
    analyst_report = ""
    debate_summary = ""
    for step in steps:
        role = step.get("role", "")
        content = step.get("content", "")
        if role == "Market Analyst":
            analyst_report = content
        elif role == "Debate Summary":
            debate_summary = content
    col1, col2 = st.columns(2)
    with col1:
        with st.expander("📊 分析师报告", expanded=True):
            st.write(analyst_report) if analyst_report else st.info("暂无分析师报告")
    with col2:
        with st.expander("⚖️ 辩论总结", expanded=True):
            st.write(debate_summary) if debate_summary else st.info("暂无辩论总结")
    st.divider()
    st.subheader("📋 完整步骤时间线")
    if steps:
        for step in reversed(steps):
            role = step.get("role", "unknown")
            content = step.get("content", "")
            timestamp = step.get("timestamp", "")
            icon = "🔹"
            if "Market Analyst" in role: icon = "📊"
            elif "Bull" in role: icon = "🐂"
            elif "Bear" in role: icon = "🐻"
            elif "Debate" in role: icon = "⚖️"
            elif "Trader" in role: icon = "🎯"
            elif "system" in role: icon = "⚙️"
            elif "error" in role: icon = "❌"
            elif "data" in role: icon = "📈"
            elif "thought" in role or "action" in role: icon = "💭"
            with st.container():
                st.markdown(f"""<div style="padding: 10px; margin: 5px 0; background-color: #1e2329; border-radius: 8px; border-left: 4px solid #58a6ff;"><div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">{icon} <strong>{role}</strong> • {format_timestamp(timestamp)}</div><div style="color: #f0f6fc;">{content}</div></div>""", unsafe_allow_html=True)
    else:
        st.info("暂无步骤记录")
    time.sleep(5)
    st.rerun()

if __name__ == "__main__":
    main()
DASHEOF

# 4. 创建 requirements.txt
echo "[4/7] 创建 requirements.txt..."
cat > "$SCRIPT_DIR/requirements.txt" << 'REQEOF'
streamlit==1.32.0
langgraph==0.0.24
langchain==0.1.12
langchain-openai==0.0.8
yfinance==0.2.37
python-dotenv==1.0.1
openai==1.14.2
REQEOF

# 5. 创建 .env.example
echo "[5/7] 创建 .env.example..."
cat > "$SCRIPT_DIR/.env.example" << 'ENVEOF'
# DeepSeek API 配置
DEEPSEEK_API_KEY=your_key_here
ENVEOF

# 6. 创建 .streamlit/config.toml
echo "[6/7] 创建配置文件..."
cat > "$SCRIPT_DIR/.streamlit/config.toml" << 'STREAMEOF'
[server]
port = 8501
address = "0.0.0.0"
maxUploadSize = 1
enableCORS = false
enableXsrfProtection = true

[client]
showErrorDetails = false

[theme]
base = "dark"
primaryColor = "#58a6ff"
backgroundColor = "#0e1117"
secondaryBackgroundColor = "#1e2329"
textColor = "#f0f6fc"
STREAMEOF

# 7. 设置权限并安装依赖
echo "[7/7] 设置权限并安装依赖..."
chmod +x "$SCRIPT_DIR/agent.py" "$SCRIPT_DIR/dashboard.py"

echo ""
echo "=========================================="
echo "✅ 文件创建完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 创建虚拟环境并安装依赖："
echo "   python3 -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo ""
echo "2. 配置 API Key："
echo "   cp .env.example .env"
echo "   nano .env  # 填入你的 DeepSeek API Key"
echo ""
echo "3. 运行测试："
echo "   python agent.py AAPL"
echo ""
echo "4. 启动监控面板："
echo "   streamlit run dashboard.py"
echo ""

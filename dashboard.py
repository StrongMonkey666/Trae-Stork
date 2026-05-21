#!/usr/bin/env python3
import os
import json
import time
from datetime import datetime
import streamlit as st

# Page configuration
st.set_page_config(
    page_title="AI 交易团队监控面板",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Apply dark theme
st.markdown("""
    <style>
    .stApp {
        background-color: #0e1117;
    }
    .metric-card {
        background-color: #1e2329;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #30363d;
    }
    .card-title {
        color: #8b949e;
        font-size: 14px;
        margin-bottom: 8px;
    }
    .card-value {
        color: #f0f6fc;
        font-size: 28px;
        font-weight: bold;
    }
    .decision-buy {
        color: #3fb950;
    }
    .decision-sell {
        color: #f85149;
    }
    .decision-hold {
        color: #d29922;
    }
    </style>
""", unsafe_allow_html=True)

# Constants
STATE_FILE = "state.json"

def load_state():
    """Load state from JSON file"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
    return None

def format_timestamp(ts):
    """Format ISO timestamp to readable string"""
    try:
        dt = datetime.fromisoformat(ts)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return ts

def get_decision_class(decision):
    """Get CSS class for decision"""
    decision = decision or ""
    if "买入" in decision:
        return "decision-buy"
    elif "卖出" in decision:
        return "decision-sell"
    else:
        return "decision-hold"

def main():
    st.title("📈 AI 交易团队监控面板")
    
    # Manual refresh button
    col1, col2, col3 = st.columns([1, 1, 1])
    with col3:
        if st.button("🔄 手动刷新", use_container_width=True):
            st.rerun()
    
    st.divider()
    
    # Load state
    state = load_state()
    
    if not state:
        st.warning("⚠️ Agent 尚未运行，请先执行 agent.py")
        st.info("提示: 运行 `python agent.py AAPL` 来启动分析流程")
        
        # Auto refresh
        time.sleep(5)
        st.rerun()
        return
    
    # Top metrics
    col1, col2 = st.columns(2)
    
    with col1:
        price = state.get("latest_price", 0)
        st.markdown(f"""
            <div class="metric-card">
                <div class="card-title">💵 最新股票价格</div>
                <div class="card-value">${price:.2f}</div>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        decision = state.get("last_decision", "N/A")
        decision_class = get_decision_class(decision)
        st.markdown(f"""
            <div class="metric-card">
                <div class="card-title">🎯 当前交易决策</div>
                <div class="card-value {decision_class}">{decision}</div>
            </div>
        """, unsafe_allow_html=True)
    
    st.divider()
    
    # Middle section - Analyst report and debate summary
    steps = state.get("steps", [])
    
    # Find specific content from steps
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
            if analyst_report:
                st.write(analyst_report)
            else:
                st.info("暂无分析师报告")
    
    with col2:
        with st.expander("⚖️ 辩论总结", expanded=True):
            if debate_summary:
                st.write(debate_summary)
            else:
                st.info("暂无辩论总结")
    
    st.divider()
    
    # Bottom section - Full timeline
    st.subheader("📋 完整步骤时间线")
    
    if steps:
        for i, step in enumerate(reversed(steps)):
            role = step.get("role", "unknown")
            content = step.get("content", "")
            timestamp = step.get("timestamp", "")
            
            # Role-specific icons
            icon = "🔹"
            if "Market Analyst" in role:
                icon = "📊"
            elif "Bull" in role:
                icon = "🐂"
            elif "Bear" in role:
                icon = "🐻"
            elif "Debate" in role:
                icon = "⚖️"
            elif "Trader" in role:
                icon = "🎯"
            elif "system" in role:
                icon = "⚙️"
            elif "error" in role:
                icon = "❌"
            elif "data" in role:
                icon = "📈"
            elif "thought" in role or "action" in role:
                icon = "💭"
            
            with st.container():
                st.markdown(f"""
                    <div style="padding: 10px; margin: 5px 0; background-color: #1e2329; border-radius: 8px; border-left: 4px solid #58a6ff;">
                        <div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">
                            {icon} <strong>{role}</strong> • {format_timestamp(timestamp)}
                        </div>
                        <div style="color: #f0f6fc;">{content}</div>
                    </div>
                """, unsafe_allow_html=True)
    else:
        st.info("暂无步骤记录")
    
    # Auto refresh every 5 seconds
    time.sleep(5)
    st.rerun()

if __name__ == "__main__":
    main()

import streamlit as st
import google.generativeai as genAI
import json
import os
from datetime import datetime

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="NexusFlow AI | Team Coordination",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- CUSTOM CSS FOR PREMIUM LOOK ---
st.markdown("""
    <style>
    .main {
        background-color: #0f172a;
    }
    .stTextArea textarea {
        background-color: rgba(30, 41, 59, 0.7);
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
    }
    .glass-card {
        background: rgba(30, 41, 59, 0.7);
        padding: 20px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 20px;
    }
    .status-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    .priority-high { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .priority-medium { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .priority-low { background-color: rgba(16, 185, 129, 0.2); color: #10b981; }
    </style>
    """, unsafe_allow_html=True)

# --- API SETUP ---
API_KEY = st.secrets.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genAI.configure(api_key=API_KEY)

SYSTEM_PROMPT = """
You are an AI-powered team coordination assistant.
Analyze the provided conversation logs, meeting notes, or task updates.
Extract structured tasks, detect blockers, and predict potential delays.

RULES:
- Do not hallucinate unknown names or deadlines.
- If data is missing, leave fields empty.
- Keep output concise and structured.
- Focus on actionable insights only.
- Respond ONLY with a clean JSON object following this format:
{
  "tasks": [{ "title": "", "description": "", "assignee": "", "deadline": "", "priority": "low | medium | high", "status": "pending" }],
  "blockers": [{ "issue": "", "affected_tasks": [] }],
  "predictions": [{ "task": "", "risk_level": "low | medium | high", "reason": "" }],
  "suggestions": [""]
}
"""

def analyze_sync(content):
    model = genAI.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(f"{SYSTEM_PROMPT}\n\nINPUT:\n{content}")
    try:
        # Extract JSON from the response text
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end])
    except Exception as e:
        return {"error": f"Failed to parse AI response: {str(e)}"}

# --- UI LAYOUT ---
st.title("🚀 NexusFlow AI")
st.caption("Intelligent Team Coordination & Workflow Visibility")

col1, col2 = st.columns([1, 1.5])

with col1:
    st.subheader("📥 Team Sync Input")
    raw_input = st.text_area("Paste meeting notes or chat logs here:", height=300, placeholder="Example: Sarah mentioned the API is delayed until Tuesday. John needs to finish the documentation.")
    
    if st.button("Analyze & Sync Tasks", type="primary", use_container_width=True):
        if not API_KEY:
            st.error("Missing GEMINI_API_KEY. Please set it in secrets or environment variables.")
        elif not raw_input.strip():
            st.warning("Please enter some text to analyze.")
        else:
            with st.spinner("AI is analyzing team progress..."):
                result = analyze_sync(raw_input)
                st.session_state['analysis'] = result

    if 'analysis' in st.session_state and 'suggestions' in st.session_state['analysis']:
        st.write("---")
        st.subheader("💡 Suggestions")
        for sug in st.session_state['analysis']['suggestions']:
            st.info(sug)

with col2:
    st.subheader("📊 Intelligence Dashboard")
    
    if 'analysis' in st.session_state:
        res = st.session_state['analysis']
        
        if "error" in res:
            st.error(res["error"])
        else:
            # Blockers & Risks
            r1, r2 = st.columns(2)
            with r1:
                st.markdown("**🚨 Active Blockers**")
                if res['blockers']:
                    for b in res['blockers']:
                        st.error(f"{b['issue']} \n\n (Affects: {', '.join(b['affected_tasks'])})")
                else:
                    st.success("No blockers detected!")
            
            with r2:
                st.markdown("**⚠️ Risk Predictions**")
                if res['predictions']:
                    for p in res['predictions']:
                        level = p['risk_level'].lower()
                        st.warning(f"**{p['task']}** ({level.upper()})\n\n{p['reason']}")
                else:
                    st.success("No predicted risks.")

            st.write("---")
            
            # Task Table
            st.markdown("**📋 Extracted Tasks**")
            if res['tasks']:
                for t in res['tasks']:
                    with st.expander(f"{t['title']} - {t['assignee'] or 'Unassigned'}"):
                        st.write(f"**Description:** {t['description']}")
                        c1, c2, c3 = st.columns(3)
                        c1.write(f"**Priority:** {t['priority'].upper()}")
                        c2.write(f"**Deadline:** {t['deadline'] or 'None'}")
                        c3.write(f"**Status:** {t['status']}")
            else:
                st.info("No tasks found in the input.")
    else:
        st.info("Paste your team updates on the left and click 'Analyze' to see the dashboard.")

# --- FOOTER ---
st.markdown("---")
st.caption(f"NexusFlow AI v2.0 (Python Edition) | Built for Contest Submission | {datetime.now().strftime('%Y-%m-%d')}")

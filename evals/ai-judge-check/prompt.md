---
max_turns: 25
runs: 2
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

We built an LLM judge to grade our support bot's answers, and checked it against our own labels — the results are in judge-labels.csv. It agrees with us 85% of the time. Can we use it instead of reviewing answers by hand? I won't be around to answer questions, so just tell me here.

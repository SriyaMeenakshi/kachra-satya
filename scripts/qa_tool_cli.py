"""Run one Q&A lookup tool from the command line (used to test the agent prompt without an API key).
Usage: python scripts/qa_tool_cli.py lookup_state '{"state": "Kerala", "year": "2023-24"}'
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_agent
print(qa_agent.run_tool(sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}))

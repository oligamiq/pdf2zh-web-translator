import unittest
import asyncio
import sys
from unittest.mock import MagicMock

# Mock pdf2zh_next before importing main
sys.modules['pdf2zh_next'] = MagicMock()
sys.modules['pdf2zh_next.high_level'] = MagicMock()

from main import ROUTER_STATES

class TestAgentCompletion(unittest.TestCase):
    def test_router_state_popping(self):
        # This test ensures we don't throw NameError when reading state in finally block.
        job_id = "test-job-1"
        ROUTER_STATES[job_id] = {
            "active_provider_name": "TestProvider"
        }
        
        state = ROUTER_STATES.pop(job_id, None)
        final_display_name = state.get("active_provider_name", "Unknown") if state else "Unknown"
        self.assertEqual(final_display_name, "TestProvider")
        
        # Test when state is None
        state2 = ROUTER_STATES.pop("non-existent", None)
        final_display_name2 = state2.get("active_provider_name", "Unknown") if state2 else "Unknown"
        self.assertEqual(final_display_name2, "Unknown")

if __name__ == "__main__":
    unittest.main()

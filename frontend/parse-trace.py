import json
import sys

def main():
    try:
        with open('perf-trace-before.json') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Trace file not found")
        return

    events = data.get('traceEvents', [])
    forced_events = []
    
    for event in events:
        if event.get('name') in ('UpdateLayoutTree', 'Layout'):
            args = event.get('args', {})
            begin_data = args.get('beginData', {})
            data_dict = args.get('data', {})
            
            stack_trace = begin_data.get('stackTrace', []) or data_dict.get('stackTrace', [])
            if stack_trace:
                forced_events.append((event, stack_trace))
            
    print(f"Forced events with JS stack traces: {len(forced_events)}")
    
    for event, stack_trace in forced_events:
        dur = event.get('dur', 0) / 1000.0  # ms
        print(f"\nEvent: {event.get('name')}, Duration: {dur:.2f} ms")
        for frame in stack_trace:
            url = frame.get('url', '')
            func = frame.get('functionName', '(anonymous)')
            line = frame.get('lineNumber', 0)
            print(f"  at {func} ({url}:{line})")

if __name__ == "__main__":
    main()

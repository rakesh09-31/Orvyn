"""
ORVYN Streaming Cleaner Module
Handles real-time token-level filtering and suppression of internal thinking (<think>),
planning preamble, meta commentary, and post-code ramblings during streaming inference.
"""

import re
from typing import Generator, Iterable, Optional


class StreamingThinkTagFilter:
    """
    Suppresses <think>...</think> tags and all content inside them across chunk boundaries.
    """
    def __init__(self):
        self.in_think = False
        self.partial_buffer = ""

    def process_chunk(self, chunk: str) -> str:
        if not chunk:
            return ""

        text = self.partial_buffer + chunk
        self.partial_buffer = ""
        output_parts = []
        i = 0
        n = len(text)

        while i < n:
            if not self.in_think:
                open_pos = text.lower().find("<think>", i)
                if open_pos != -1:
                    output_parts.append(text[i:open_pos])
                    self.in_think = True
                    i = open_pos + len("<think>")
                else:
                    remaining = text[i:]
                    matched_prefix_len = 0
                    for plen in range(min(len(remaining), len("<think>") - 1), 0, -1):
                        if "<think>".startswith(remaining[-plen:].lower()):
                            matched_prefix_len = plen
                            break
                    if matched_prefix_len > 0:
                        output_parts.append(remaining[:-matched_prefix_len])
                        self.partial_buffer = remaining[-matched_prefix_len:]
                        i = n
                    else:
                        output_parts.append(remaining)
                        i = n
            else:
                close_pos = text.lower().find("</think>", i)
                if close_pos != -1:
                    self.in_think = False
                    i = close_pos + len("</think>")
                else:
                    remaining = text[i:]
                    matched_prefix_len = 0
                    for plen in range(min(len(remaining), len("</think>") - 1), 0, -1):
                        if "</think>".startswith(remaining[-plen:].lower()):
                            matched_prefix_len = plen
                            break
                    if matched_prefix_len > 0:
                        self.partial_buffer = remaining[-matched_prefix_len:]
                    i = n

        return "".join(output_parts)

    def flush(self) -> str:
        if not self.in_think and self.partial_buffer:
            out = self.partial_buffer
            self.partial_buffer = ""
            return out
        self.partial_buffer = ""
        return ""


class StreamingCodingFilter:
    """
    Streaming filter specifically for CODING intent.
    Suppresses leading planning/meta text, streams only legitimate code,
    and stops streaming when code ends / post-code commentary begins.
    """
    def __init__(self, fallback_code: str = ""):
        self.fallback_code = fallback_code
        self.think_filter = StreamingThinkTagFilter()
        self.in_code = False
        self.in_fence = False
        self.pre_buffer = ""
        self.yielded_code = False
        self.stopped = False
        self.stream_buffer = ""

    def process_chunk(self, raw_chunk: str) -> Optional[str]:
        if self.stopped:
            return None

        chunk = self.think_filter.process_chunk(raw_chunk)
        if not chunk:
            return None

        if not self.in_code:
            self.pre_buffer += chunk

            # 1. Check for markdown code fence start: ```python, ```py, ```
            fence_match = re.search(r"```(?:python|py|javascript|js|java|cpp|c|sql|html|css)?\s*\n?", self.pre_buffer, re.IGNORECASE)
            if fence_match:
                self.in_code = True
                self.in_fence = True
                code_start = fence_match.end()
                code_after = self.pre_buffer[code_start:]
                self.pre_buffer = ""
                if code_after:
                    return self._process_fence_code(code_after)
                return None

            # 2. Check for raw code starting keywords at beginning of line
            code_stmt_match = re.search(
                r"(?:^|\n)(def\s+\w+\s*\(|class\s+\w+|import\s+\w+|from\s+\w+\s+import|async\s+def\s+\w+\s*\(|function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=)",
                self.pre_buffer,
            )
            if code_stmt_match:
                self.in_code = True
                self.in_fence = False
                start_pos = code_stmt_match.start()
                if self.pre_buffer[start_pos] == "\n":
                    start_pos += 1
                code_after = self.pre_buffer[start_pos:]
                self.pre_buffer = ""
                if code_after:
                    return self._process_raw_code(code_after)
                return None

            # Still in preamble; hold in pre_buffer
            return None

        else:
            if self.in_fence:
                return self._process_fence_code(chunk)
            else:
                return self._process_raw_code(chunk)

    def _process_fence_code(self, text: str) -> Optional[str]:
        if self.stopped:
            return None

        combined = self.stream_buffer + text
        self.stream_buffer = ""

        # Check for closing fence ```
        if "```" in combined:
            code_part = combined.split("```", 1)[0]
            self.stopped = True
            if code_part:
                self.yielded_code = True
                return code_part
            return None

        # Hold partial backticks at the end of combined
        if combined.endswith("``"):
            self.stream_buffer = "``"
            to_yield = combined[:-2]
        elif combined.endswith("`"):
            self.stream_buffer = "`"
            to_yield = combined[:-1]
        else:
            to_yield = combined

        if to_yield:
            self.yielded_code = True
            return to_yield
        return None

    def _process_raw_code(self, text: str) -> Optional[str]:
        if self.stopped:
            return None

        combined = self.stream_buffer + text
        self.stream_buffer = ""

        # Meta/commentary phrases that signal post-code rambling when occurring after newline
        stop_markers = [
            r"\n\s*(?:Wait|However|Alternatively|Let me|Let\'s|Note:|This code|The code|Hope this|In this solution|Explanation:|For example|To use this|Example usage|Output:)",
        ]

        for sm in stop_markers:
            if re.search(sm, combined, re.IGNORECASE):
                code_part = re.split(sm, combined, maxsplit=1, flags=re.IGNORECASE)[0]
                self.stopped = True
                if code_part:
                    self.yielded_code = True
                    return code_part
                return None

        # Hold trailing newline or partial lines if they might precede a stop marker
        if combined.endswith("\n"):
            self.stream_buffer = "\n"
            to_yield = combined[:-1]
        else:
            to_yield = combined

        if to_yield:
            self.yielded_code = True
            return to_yield
        return None

    def flush(self) -> Optional[str]:
        if self.stopped:
            return None

        flushed_think = self.think_filter.flush()
        if flushed_think:
            res = self.process_chunk(flushed_think)
            if res:
                return res

        # Flush any held buffer
        if self.in_code and self.stream_buffer:
            buf = self.stream_buffer
            self.stream_buffer = ""
            if not self.stopped and buf != "`" and buf != "``":
                self.yielded_code = True
                return buf

        if not self.yielded_code:
            if self.fallback_code:
                self.yielded_code = True
                return self.fallback_code
            if self.pre_buffer:
                cleaned = self.pre_buffer.strip()
                self.pre_buffer = ""
                if cleaned:
                    self.yielded_code = True
                    return cleaned
        return None

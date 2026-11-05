import re

with open('src/components/LiveNewsFeed.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import_target = "  Heart\n} from 'lucide-react';"
import_replacement = """  Heart,
  Bot
} from 'lucide-react';
import { RunActionButton, type StepItem } from './watermelon/run-action-button';

const WIRE_REFRESH_STEPS: StepItem[] = [
  { id: 'poll', label: 'Polling GNews v4 Syndication', icon: Radio },
  { id: 'parse', label: 'Filtering Category Wire Feeds', icon: Globe },
  { id: 'sync', label: 'Syncing Live Dispatches', icon: CheckCircle2 },
];

const WIRE_VERIFICATION_STEPS: StepItem[] = [
  { id: 'headline', label: 'Parsing Claim Semantics', icon: Radio },
  { id: 'wires', label: 'Correlating Wire Registries', icon: Globe },
  { id: 'gemini', label: 'Dispatching to Gemini Sentinel', icon: Bot },
  { id: 'verdict', label: 'Synthesizing Truth Report', icon: Sparkles },
];"""

assert import_target in text, "import_target not found in LiveNewsFeed.tsx"
text = text.replace(import_target, import_replacement, 1)

# Replace masthead refresh button
refresh_btn_pattern = re.compile(
    r'<button\s+onClick=\{\(\) => fetchNews\(true\)\}\s+disabled=\{isLoading \|\| isRefreshing\}[\s\S]*?<\/button>',
    re.MULTILINE
)

new_refresh_btn = """<RunActionButton
              type="button"
              size="compact"
              onClick={() => fetchNews(true)}
              disabled={isLoading || isRefreshing}
              isExecuting={isRefreshing}
              idleLabel="Refresh Feed"
              idleIcon={RefreshCw}
              doneLabel="Wire Feed Synced"
              doneIcon={CheckCircle2}
              steps={WIRE_REFRESH_STEPS}
            />"""

assert refresh_btn_pattern.search(text) is not None, "refresh_btn_pattern not matched"
text = refresh_btn_pattern.sub(new_refresh_btn, text, count=1)

# Replace card verify button
card_verify_pattern = re.compile(
    r'<button\s+type="button"\s+onClick=\{\(\) => handleVerifyArticle\(article\)\}\s+disabled=\{isCurrentlyVerifying\}[\s\S]*?<\/button>',
    re.MULTILINE
)

new_card_verify = """<div className="w-full flex justify-center">
                      <RunActionButton
                        type="button"
                        size="compact"
                        onClick={() => handleVerifyArticle(article)}
                        disabled={isCurrentlyVerifying}
                        isExecuting={isCurrentlyVerifying}
                        idleLabel="Verify Claim with AI"
                        idleIcon={Sparkles}
                        doneLabel="Claim Dispatched"
                        doneIcon={CheckCircle2}
                        steps={WIRE_VERIFICATION_STEPS}
                        className="w-full"
                      />
                    </div>"""

assert card_verify_pattern.search(text) is not None, "card_verify_pattern not matched"
text = card_verify_pattern.sub(new_card_verify, text, count=1)

with open('src/components/LiveNewsFeed.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated LiveNewsFeed.tsx successfully!")

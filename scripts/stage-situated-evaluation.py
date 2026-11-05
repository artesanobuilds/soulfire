"""Prepare a key-free isolated build, with only matched evaluation substitutions."""
import hashlib
import io
import json
import subprocess
import tarfile
from pathlib import Path

root = Path.cwd()
target = Path('/tmp/soulfire-situated-runtime-20261105')
if target.exists():
    raise SystemExit('Staging already exists; inspect it rather than overwrite')
archive = subprocess.check_output(['git', 'archive', '00bc156'])
target.mkdir(parents=True)
with tarfile.open(fileobj=io.BytesIO(archive)) as source:
    source.extractall(target, filter='data')
(target / 'node_modules').symlink_to('/Users/miguelalvarado/Coding/soulfire/node_modules')
old = subprocess.check_output(['git', 'show', 'a73e1b15:src/lib/agent.ts']).decode()
(target / 'src/lib/agent-baseline.ts').write_text(old)
changes = []
for relative, import_line, replacement in [
    ('app/api/realtime/route.ts', 'import { voiceInstructions as baselineVoiceInstructions } from "@/src/lib/agent-baseline";\n', ('${voiceInstructions}', '${process.env.SOULFIRE_EVAL_ARM === "baseline" ? baselineVoiceInstructions : voiceInstructions}')),
    ('src/infrastructure/openai-responses.ts', 'import { instructions as baselineInstructions } from "../lib/agent-baseline";\n', ('${instructions}', '${process.env.SOULFIRE_EVAL_ARM === "baseline" ? baselineInstructions : instructions}')),
]:
    path = target / relative
    original = path.read_text()
    assert original.count(replacement[0]) == 1
    changed = import_line + original.replace(*replacement)
    if relative.endswith('openai-responses.ts'):
        changed = 'import { appendFileSync } from "node:fs";\n' + changed
        changed = changed.replace('const data = await res.json();', 'const data = await res.json();\n    if (process.env.SOULFIRE_EVAL_USAGE_FILE) appendFileSync(process.env.SOULFIRE_EVAL_USAGE_FILE, JSON.stringify({at: new Date().toISOString(), model: data.model, usage: data.usage, responseId: data.id}) + "\\n");')
    path.write_text(changed)
    changes.append({'path': relative, 'originalSha256': hashlib.sha256(original.encode()).hexdigest(), 'stagedSha256': hashlib.sha256(changed.encode()).hexdigest()})
manifest = {'status': 'staged, not built', 'sourceCommit': '00bc156', 'baselineCommit': 'a73e1b15', 'substitutions': 'Server-only baseline prompt selection by SOULFIRE_EVAL_ARM with merged matched far-field noise reduction, threshold 0.65 and 1500ms VAD. No user private context or credentials copied.', 'changes': changes, 'paidCalls': 0}
(root / 'test-results/situated-runtime-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(target)

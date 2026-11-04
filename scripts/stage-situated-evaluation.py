"""Prepare a key-free isolated build, with only matched evaluation substitutions."""
import hashlib
import io
import json
import subprocess
import tarfile
from pathlib import Path

root = Path.cwd()
target = Path('/tmp/soulfire-situated-runtime-20261104')
if target.exists():
    raise SystemExit('Staging already exists; inspect it rather than overwrite')
archive = subprocess.check_output(['git', 'archive', '6a08401'])
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
    if relative.endswith('route.ts'):
        assert changed.count('type: "server_vad",') == 1
        changed = changed.replace('type: "server_vad",', 'type: "server_vad",\n              silence_duration_ms: 1500,')
    path.write_text(changed)
    changes.append({'path': relative, 'originalSha256': hashlib.sha256(original.encode()).hexdigest(), 'stagedSha256': hashlib.sha256(changed.encode()).hexdigest()})
manifest = {'status': 'staged, not built', 'sourceCommit': '6a08401', 'baselineCommit': 'a73e1b15', 'substitutions': 'Server-only baseline prompt selection by SOULFIRE_EVAL_ARM and matched 1500ms VAD. No user private context or credentials copied.', 'changes': changes, 'paidCalls': 0}
(root / 'test-results/situated-runtime-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(target)

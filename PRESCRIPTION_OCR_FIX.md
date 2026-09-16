# MediKiosk AI – Prescription OCR Fix

## Fixed issues
- Corrects common OCR spelling errors such as `Amoxiciillin` -> `Amoxicillin` and `Cetrizine` -> `Cetirizine`.
- Prevents an unrelated AI medicine name such as `Cobimzbue` from replacing a medicine identified by local OCR.
- Parses multi-line handwritten prescription rows so medicine name, strength, dosage form, frequency, duration and food instruction can be on separate lines.
- Correctly extracts the supplied sample as:
  - Paracetamol 500 mg — 1 tablet — Three times daily (1-1-1) — 3 days — After food
  - Cetirizine 10 mg — 1 tablet — At bedtime (0-0-1) — 5 days — At bedtime
  - Amoxicillin 500 mg — 1 capsule — Three times daily (1-1-1) — 5 days — After food
- Gemini remains available for multimodal verification, but local OCR is used as the factual anchor whenever it has a usable value.

## Important
The original `.env` file was intentionally not included in this redistributed ZIP. Use `.env.example` / Google AI Studio Secrets for runtime credentials.

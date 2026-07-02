# KHAOS-Researcher: Curation Criteria for Provider Lanes

**Written:** 2026-07-02 (COT-75/C)  
**Owner:** Kurt  
**Applies to:** Provider Distribution chart, Region chart, curated model list

---

## The criterion

A provider earns a lane when it has **deployed commercial frontier presence**: at least one widely-used model family in production that meaningfully advances capability, is available to external users, and has genuine adoption beyond a single-institution pilot.

"Frontier" is not just parameter count. It means the model family is competitive in at least one capability dimension (reasoning, code, vision, image generation) at the time of listing.

---

## Active providers (as of Q2 2026)

| Provider | HQ | Region | Families | Notes |
|---|---|---|---|---|
| OpenAI | San Francisco, CA | US | 8+ | GPT, o-series, DALL-E, Whisper, embeddings |
| Google | Mountain View, CA | US | 6+ | Gemini family |
| Anthropic | San Francisco, CA | US | 5+ | Claude family |
| xAI | Austin, TX | US | 4+ | Grok family |
| Meta | Menlo Park, CA | US | 1 | LLaMA (open-weight) |
| Microsoft | Redmond, WA | US | 1 | Phi (open-weight via research) |
| Cohere | Toronto, ON | CA | 1 | Command family; first-mover in enterprise RAG |
| DeepSeek | Hangzhou | CN | 4 | V2/V3/R1/Coder; disrupted cost curve |
| Alibaba | Hangzhou | CN | 1 | Qwen (open-weight) |
| Zhipu AI | Beijing | CN | 2 | GLM family; named beneficiary of June 2026 export-control window |
| Mistral | Paris | FR | 2 | Mistral/Mixtral; only EU commercial frontier lab |
| Black Forest Labs | Freiburg im Breisgau | DE | 1 | FLUX image generation; powers xAI Grok image gen; EU-hosted, US-VC-funded |

---

## Documented exclusions

### Teuken / OpenGPT-X
**Excluded on criteria, not contempt.**  
Publicly funded research consortium (Fraunhofer, DFKI, etc.). No deployed commercial frontier product as of Q2 2026. May earn a lane if it ships a production model family with external access. Revisit quarterly.

### Aleph Alpha
**Historical footnote.**  
Competed as a German frontier LLM lab through 2023. Pivoted in 2024 away from frontier model competition toward sovereignty consulting and enterprise services. The Luminous models are no longer competitive at the frontier. Including Aleph Alpha would misrepresent the current landscape; excluding it correctly shows Germany's frontier as Black Forest Labs (FLUX) — which is itself a sliver.

### DeepL
**World-class but domain-specific.**  
Best-in-class for neural machine translation. Not a general-purpose frontier model provider. Tooltip footnote in region chart if ever requested; does not earn a lane in the Provider Distribution.

### Stability AI
**Fading, optional.**  
Stable Diffusion was frontier in 2022–2023. Company has faced financial instability. May be added as a historical note if requested; current frontier presence is unclear.

### Moonshot AI / Kimi (China)
**Borderline.**  
Long-context capability is genuine (1M token window). Commercial deployment exists. Not yet included pending verification of family breadth. Revisit next quarter; likely earns a CN lane entry if sustained.

---

## The Germany lane

Germany's near-empty lane (one company, one niche) **renders deliberately** (COT-75/E). Black Forest Labs (Freiburg) is genuine German frontier presence in image generation and earns its bar. The sliver is the finding: Europe reguliert, was es nicht baut.

Rendering Germany as zero would be wrong (BFL is real). Rendering it as prominent would misrepresent (one image-gen company ≠ national AI industry). The near-empty lane with tooltip is the honest chart.

---

## Refresh cadence

Review additions/exclusions each quarter alongside the quarterly valuation refresh (see `docs/quarterly-refresh.md`). The bar for inclusion is the same bar every quarter: **deployed commercial frontier presence**.

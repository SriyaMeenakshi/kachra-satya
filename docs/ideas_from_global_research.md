# Ideas from global waste-data systems (researched 2026-11-10)

Sources are listed with each item. Most are NGO reports, academic papers, press or vendor material, not official audits; each is marked.

## Similar problems elsewhere
- **EU / Bulgaria.** An NGO report found large gaps between Eurostat figures and local municipal data: national packaging recycling rate 50.6% (2019) while 132 municipalities reported under 10% (advocacy source). https://zerowasteeurope.eu/press-release/large-reporting-discrepencies-in-bulgarian-waste-collection-data-new-report-says/
- **Nordic study.** The common EU definition of municipal waste has ambiguities, and recycling rates dropped when countries aligned to revised EU rules. https://pub.norden.org/temanord2025-535
- **Indonesia (SIPSN).** Self-reported local data, incomplete; Kompas reports only 276 of 514 cities and regencies supplied waste-reduction data. Two cited managed-waste shares disagree (61.62% vs about 33%), so use with care. https://so01.tci-thaijo.org/index.php/APST/article/view/271002
- **Brazil (SNIS / SINISA).** A dissertation found solid-waste indicator outliers that recur in certain municipalities, pointing beyond typing errors. Official validation process not confirmed. https://repositorio.unb.br/bitstream/10482/51600/1/EsdraAderaldoOliveira_DISSERT.pdf
- **World Bank "What a Waste".** Leeds authors say it is unclear whether point-by-point quality control was applied; they built a quality-assured 40-city dataset (WABI). https://eprints.whiterose.ac.uk/id/eprint/197404/1/1-s2.0-S0048969723005284-main.pdf and https://zenodo.org/record/7570174
- **UNEP.** Reliable waste data is named a key concern; GWMO 2024 has a data platform. https://www.unep.org/ietc/resources/report/global-waste-management-outlook-2024

## Systems worth borrowing
1. **England WasteDataFlow validation.** Three stages (internal consistency and comparison with earlier returns; Environment Agency; national review), risk-based audit visits, no changes after Q4 validation, a published quality report (Wales). Limit: only as accurate as whoever reports. https://assets.publishing.service.gov.uk/media/67e2bba55698d84e39cfdad4/Methodology_summary_202324.pdf , https://www.gov.wales/local-authority-municipal-waste-management-quality-report-html
2. **South Korea Allbaro.** Electronic manifest for industrial waste with RFID, introduced 2003, mandatory 2008 (all industrial waste 2011); regulators see treatment data in real time. Volume-based household fees not researched. https://wesr-search.unep.org/ckan/dataset/625139a8-c0a5-4739-88bb-b7596e7a8532 , https://unu.edu/sites/default/files/2026-10/Policy%20Brief%20Data-Driven%20Waste%20Management%2029102026.pdf
3. **Indore weighbridge and GPS.** Exists, but no independent check was found that weighbridge tonnage matches GPS trips (government and vendor sources only). https://www.smartcityindore.org/?p=220
4. **Satellite checks of landfills.** Studies find inventories often underestimate landfill methane; one study of 38 super-emitter landfills found about twice Climate TRACE figures; a secondary news report says open dumps were underestimated about 5.3 times (verify against the paper). Small samples. https://www.esa.int/Applications/Observing_the_Earth/Space_for_our_climate/Satellites_help_tackle_landfill_methane_leaks

## What to build (from data we already have)
- **Definition crosswalk:** MoHUA "processed" vs CPCB "treated" are not defined identically; our data stores MoHUA processed as treated and the app must say so. (EU and Nordic lesson.)
- **Reporting-completeness score** by state: how many metrics and years are reported. (Indonesia coverage gap.)
- **Risk-based audit list:** combine flags, volatility and the CPCB-vs-MoHUA gap into "audit these states first". (WasteDataFlow.)
- **Recurrence flags:** states that trip the same rule in several years, for example Kerala treated above collected in four years. (Brazil.)
- **Publish the dataset** with a methodology note and a Zenodo record, after checking source licences. (WABI.)
- **Later, not for 15 Nov:** weighbridge-to-plant manifest reconciliation (Allbaro, Indore); satellite check of the "641 of 2,417 dumpsites remediated" claim.

## Is our data the latest? (checked 2026-11-10)
- **MoHUA:** our newest is Rajya Sabha Q2433, 10 Aug 2026 (2025-26). Earlier MoHUA statements found in secondary sources, not yet in our data and not primary-verified: Rajya Sabha Dec 2025, 166,096 generated and 133,164 processed (80.17%); Lok Sabha Feb 2026, 162,293 generated and 132,514 processed, 81.65%; MoHUA Annual Report 2025-26, 80.31% by Dec 2025. These show MoHUA's own figures moving between 80.17% and 81.65% within months. Primary sources to fetch: the Annual Report PDF https://www.mohua.gov.in/static/uploads/2026/06/474a0fe6915bd7c7c3dd7b7502583882.pdf and the two parliament answers.
- **CPCB:** our newest state table is 2023-24 (Lok Sabha, 1 Dec 2025). cpcb.gov.in lists an "Annual Report 2024-25" dated 8 Apr 2026 (https://cpcb.gov.in/annual-report.php). Unconfirmed whether it holds a 2024-25 state-wise solid waste table; must be opened by hand (cpcb.gov.in is not to be scripted).
- **Dataful dataset 19386** was last noted updated Jan 2025, so it is older than what we have.
- **New rules:** Solid Waste Management Rules, 2026 exist (not reviewed); they may change what is reported and defined.

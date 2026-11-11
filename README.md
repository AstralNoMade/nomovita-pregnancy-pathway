# NomoVita · Pregnancy pathway (demo)

An interactive single-file web module. For each stage of antenatal and postnatal care in Kazakhstan it shows the chain: stage of care → benefit package → payment method → responsible → gap → proposed change. It shows the data behind each gap and models how changing incentives and data practices could change the pathway.

Demo version 1.0, 11 November 2026. All records are synthetic; there is no personal data.

## Run

Open `index.html` in a modern browser. No server, build step or external data is needed. Fonts load from Google Fonts; without a network the page uses system fonts. The RU / EN switch is in the top right corner.

## What is inside

- **Pathway chain.** Seven stages, from early registration to the postnatal home visit. Each cell is marked Fact (legal act and clause), Assumption or Proposal; values of the synthetic set are marked Synthetic.
- **Data behind the gap.** For each stage: record fields, rule, numerator and denominator, the first records of the set and a CSV export of the whole set.
- **Findings on the norms.** Four observations on the rules for rewarding health workers and the obstetric care standard, each with its clause.
- **Pathway switch registry.** Title, class, urgency and decision type of all 45 switches; the full logic of 7 switches, one per stage.
- **Incentive model.** Switch measures on and set what share of a stage's gap each one closes. With all measures off, "after" equals "now".
- **Synthetic cases, data and method.**

## Data

A synthetic set of 1,000 pregnancies is generated in the browser from a fixed seed (mulberry32, seed 20261111), so results are reproducible. All parameters are listed on the page and in the code (`const P`). Gap values are set to demonstrate how the tool works and do not describe the health system of Kazakhstan. Stages in the set are independent except two links set by parameters (stage 1 → stage 4, stage 6 → stage 7).

## Legal sources

1. Standard for obstetric and gynaecological care in the Republic of Kazakhstan, Order of the Minister of Health No. KR DSM-92 of 26.08.2021, as amended up to Order No. 126 of 30.09.2026.
2. Rules for payment of health providers under the GVFMC and/or CSHI, Order No. KR DSM-291/2020 of 20.12.2020, as amended up to Order No. 52 of 18.05.2026.
3. Rules for rewarding health workers, Order No. KR DSM-278/2020 of 15.12.2020; annex 4 as amended by Order No. 91 of 11.08.2026.
4. Tariffs for medical services under the GVFMC and/or CSHI, Order of the Acting Minister of Health No. KR DSM-170/2020 of 30.10.2020, as amended by Order No. 176 of 31.12.2025.
5. List of the guaranteed volume of free medical care, Government Decree No. 672 of 16.10.2020, as amended by Decree No. 1086 of 15.12.2025; some provisions in force from 01.01.2027.
6. List of care in the CSHI system, Government Decree No. 421 of 20.06.2019, as amended by Decree No. 1086 of 15.12.2025.
7. Standard for primary health care in the Republic of Kazakhstan, Order of the Acting Minister of Health No. 49 of 30.03.2023.

Texts as of November 2026. Clause numbers should be checked against the official texts at adilet.zan.kz before reuse.

## Limitations

This is a demonstration, not a forecast, a recommendation or an effect estimate. Measure effects are assumptions the user can change on the page; the 10% gap display threshold and the other synthetic set parameters are set in the code (`const P`).

## Know-how

The full pathway switch registry (states, owners, immediate actions, closing conditions and payment effects for all 45 switches) is the know-how of Leila Ishbayeva, founder of NomoVita. This repository contains only what `index.html` shows.

## License

This repository, including `index.html` and the text of the seven open switches, is released under the Apache License 2.0 (see `LICENSE`). The full switch registry is not part of it.

## Contact

NOMOVITA LLP, Astana, Kazakhstan · https://nomovita.ai

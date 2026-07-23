---
title: Portfolio Composition File (PCF) Domain Knowledge Base
version: 1.0-draft
status: review-required
domain: ETF Passive Markets
audience:
  - ETF Operations
  - PCF Product Support
  - Software Engineering
  - Business Analysts
  - Application Intelligence Copilot
last_updated: 2026-07-24
document_owner: PCF Data Product Team
classification: Internal working draft
---

# Portfolio Composition File (PCF) Domain Knowledge Base

## 1. Purpose

This document explains how a daily Portfolio Composition File is derived for an ETF or share class from accounting positions, transaction activity, orders, corporate actions, index data, security reference data, NAV data, FX data, and derivative positions.

It is written as a domain knowledge source for:

- the Application Intelligence Copilot;
- L1/L2 production support;
- ETF Operations;
- business analysts;
- PCF calculation developers;
- incident root-cause and business-impact analysis.

The document covers:

- ABOR positions;
- the T−1 close-to-T publication waterfall;
- booked trades and unbooked orders;
- corporate actions;
- physical and synthetic PCFs;
- equity and Depositary Receipt positions;
- currency hedging and FX forwards;
- futures;
- cash, accrued income, fees, and balancing amounts;
- PCF field calculations;
- control totals, reconciliations, and incident scenarios.

## 2. Important implementation notice

This is a **generic but implementation-oriented model** of PCF processing. A PCF is not globally standardized down to one calculation formula or one set of fields. The exact result depends on:

- fund prospectus and basket policy;
- creation/redemption arrangement;
- issuer and fund-accounting conventions;
- physical, synthetic, optimized, or cash basket methodology;
- valuation point and publication cut-off;
- trade-date versus settlement-date accounting;
- order inclusion rules;
- corporate-action effective-date rules;
- security and DR normalization rules;
- FX source and quote direction;
- rounding and residual-cash policy;
- creation-unit size;
- distribution venue and file schema.

Rules marked **CONFIGURATION REQUIRED** must be replaced with the approved business rule before this document is treated as production truth.

The copilot must distinguish:

1. facts retrieved from production data;
2. approved business rules;
3. calculated explanations;
4. assumptions or missing information.

It must never present a generic formula as the confirmed reason for a production result unless the applicable fund configuration and source records support it.

## 3. What is a PCF?

A Portfolio Composition File describes the securities, cash, and/or other assets used to represent an ETF creation or redemption basket for a specified trading day. It supports primary-market creation/redemption activity and helps Authorized Participants understand the basket associated with a creation unit.

A PCF is related to—but is not always identical to—the fund’s full accounting holdings:

- A **full-holdings file** represents the fund’s actual positions.
- A **PCF basket** represents the assets and cash to be delivered or received for an ETF creation/redemption.
- A **pricing basket** may be optimized for intraday valuation.
- A **custom basket** may differ from a strict pro-rata slice of the portfolio under an approved basket policy.
- A **synthetic PCF** may be derived primarily from index exposure rather than the fund’s directly held collateral or derivatives.

DTCC describes a PCF as listing the names and quantities of securities, cash, and/or other assets comprising the creation or redemption basket exchanged for ETF shares. SEC and issuer material similarly distinguish basket composition from full fund holdings and recognize pro-rata, representative, and custom baskets.

## 4. Key dates and timing terms

### 4.1 T−1

`T−1` is the preceding applicable business day.

Common T−1 inputs include:

- official ABOR end-of-day positions;
- final T−1 NAV;
- T−1 shares outstanding or number of shares;
- T−1 accrued income and expenses;
- transactions booked after the prior PCF cut-off;
- corporate actions effective on T or known by the T publication cut-off;
- closing prices and FX rates used as the calculation basis.

### 4.2 T

`T` is the PCF trade/publication date for which the basket is produced.

The T PCF may include:

- T−1 closing ABOR positions rolled forward;
- eligible T trade activity received before cut-off;
- eligible orders not yet reflected in ABOR;
- corporate actions effective on T;
- new index composition effective on T;
- T share-class and creation-unit attributes;
- hedge and derivative exposure applicable to T.

### 4.3 Trade date, settlement date, effective date, and ex-date

These dates must not be treated as interchangeable:

- **Trade date:** date on which a transaction was executed.
- **Settlement date:** date on which cash and securities legally settle.
- **Corporate-action ex-date:** date from which a buyer is generally no longer entitled to the announced entitlement.
- **Record date:** date used to determine holders entitled to an action.
- **Pay date:** date on which cash or securities are paid.
- **Effective date:** date on which a security or index event becomes applicable.
- **PCF date:** date for which the output basket is valid.

## 5. Primary source systems and data domains

The application may aggregate the following data domains. Actual topic and service names are implementation-specific.

| Data domain | Typical content | Primary PCF use |
| --- | --- | --- |
| ABOR | Official accounting positions, cash, accruals, book cost | Opening portfolio state |
| Trades | Executed buys, sells, subscriptions, redemptions, derivative trades | Roll ABOR forward |
| Orders | Approved/executable activity not yet booked in ABOR | Predict intended T portfolio |
| Corporate actions | Splits, dividends, mergers, rights, spin-offs, conversions | Adjust quantity, security, cash, and entitlement |
| Index | Constituents, weights, units, divisor/reference level, effective date | Synthetic or target basket |
| Security master | ISIN, ticker, currency, asset type, multiplier, DR ratio | Identification and normalization |
| NAV | Final NAV, estimated NAV, share-class NAV, fund NAV | Basket valuation and cash component |
| Shares/NOSH | Shares outstanding and creation-unit size | Scale fund positions to one creation unit |
| FX | Spot and forward rates, currency pairs, quote convention | Base-currency conversion and hedging |
| Futures | Contracts, multiplier, underlying, expiry, price, delta | Synthetic exposure and cash treatment |
| FX forwards | Buy/sell currencies, notionals, rates, maturity, valuation | Hedged-share-class exposure |
| Fees/accruals | Management fee, custody, tax, financing, income accruals | Net asset and cash balancing |
| Fund configuration | Basket policy, rounding, exclusions, cut-offs | Governing calculation rules |

In the current application architecture, event data may be consumed from multiple Kafka topics, normalized into a Hazelcast calculation cache, validated, and then used to trigger downstream share-count and NAV-related calculations.

## 6. End-to-end calculation waterfall

The canonical calculation order is:

```text
T−1 official ABOR closing state
  → apply late/corrected T−1 activity not already represented
  → apply eligible T booked trades
  → apply eligible T orders not already represented by trades
  → apply corporate actions effective for T
  → normalize security identities and instruments
  → add/transform derivative and hedge exposures
  → select physical or synthetic basket methodology
  → scale to one creation unit
  → round constituent quantities
  → calculate constituent market values
  → calculate cash/accrual/derivative components
  → calculate balancing cash
  → validate against NAV and business controls
  → publish the PCF snapshot
```

The most important control in this chain is **no double counting**. A transaction represented in ABOR, trade events, and order events must affect the projected position only once.

## 7. Position-state model

### 7.1 Canonical projected position

For security `i`, the generic projected quantity is:

```text
ProjectedQuantity_i(T)
  = ABORClosingQuantity_i(T−1)
  + LateTMinus1Adjustment_i
  + EligibleBookedTradeQuantity_i(T)
  + EligibleOrderQuantity_i(T)
  + CorporateActionQuantityAdjustment_i(T)
  + ManualApprovedAdjustment_i(T)
```

Where:

- buys are positive;
- sells are negative;
- trade and order signs are normalized before aggregation;
- only activity not already included in the starting ABOR position is applied;
- canceled, rejected, duplicated, or superseded activity is excluded;
- corporate actions can change both security identity and quantity.

### 7.2 Cash projection

For currency `c`:

```text
ProjectedCash_c(T)
  = ABORClosingCash_c(T−1)
  + TradeSettlementCash_c
  + OrderReservedCash_c
  + CorporateActionCash_c
  + IncomeAndExpenseCash_c
  + DerivativeCashFlow_c
  + SubscriptionRedemptionCash_c
  + ManualApprovedCashAdjustment_c
```

Whether a trade contributes trade-date cash, settlement-date cash, or a receivable/payable is a configurable accounting rule.

### 7.3 Entitlement and accrual projection

```text
ProjectedAccrual(T)
  = T−1 Accrual
  + New T Accrual
  − Paid/Settled Accrual
  + CorporateAction Entitlement
  − Applicable Fees and Expenses
```

Accruals may be included in:

- a separate PCF cash/accrual field;
- the balancing cash;
- estimated NAV only;
- a fund-level rather than constituent-level output.

**CONFIGURATION REQUIRED:** Define which accrual types are exposed and how withholding tax is applied.

## 8. ABOR positions

### 8.1 Definition

ABOR means Accounting Book of Record. It is normally the authoritative accounting view of:

- settled or accounting-recognized security positions;
- cash balances by currency;
- receivables and payables;
- accrued income and expenses;
- derivative book positions;
- tax lots and book cost;
- fund and share-class accounting values.

### 8.2 ABOR is the starting state, not automatically the final PCF

The T−1 ABOR position can be stale relative to the T PCF because:

- T trades may have occurred after the accounting snapshot;
- approved orders may not yet be booked;
- a corporate action becomes effective on T;
- a security identifier changes;
- index composition changes on T;
- hedging activity is maintained in another system;
- futures exposure is represented by contracts rather than underlying units;
- synthetic funds follow index exposure rather than held collateral.

### 8.3 ABOR grain

ABOR data may be at:

- fund level;
- share-class level;
- portfolio/book level;
- security and currency level;
- lot level;
- account/custody location level.

Before calculation, positions must be aggregated to the PCF calculation key, commonly:

```text
Fund or Share Class
+ PCF Date
+ Canonical Security
+ Position Currency
+ Position Type
```

### 8.4 ABOR validations

- T−1 snapshot exists and is complete.
- Fund/share-class identifier is mapped.
- Security identifier resolves to a canonical security.
- Quantity and local/base market value signs are consistent.
- Cash currency is valid.
- Duplicate position records are not present.
- Position timestamp is before the approved cut-off.
- NAV, assets, and cash reconcile within tolerance.

## 9. T−1 and T trade processing

### 9.1 Trade quantity

Normalize the signed quantity:

```text
SignedTradeQuantity
  = AbsoluteTradeQuantity × SideSign × ReversalSign
```

Typical signs:

| Event | Sign |
| --- | ---: |
| Buy | +1 |
| Sell | −1 |
| Short sell | −1 |
| Buy to cover | +1 |
| Cancel/reversal of buy | −1 |
| Cancel/reversal of sell | +1 |

### 9.2 Trade cash

A simplified local-currency trade cash amount is:

```text
GrossTradeCashLocal
  = −SignedTradeQuantity × TradePrice × PriceFactor × ContractOrUnitFactor
```

Costs are then included:

```text
NetTradeCashLocal
  = GrossTradeCashLocal
  − Commission
  − Taxes
  − Fees
  + Rebate
```

A buy creates a negative cash movement; a sell creates a positive cash movement under this sign convention.

### 9.3 Trade inclusion rules

Include a trade only if:

- it belongs to the fund/book/share class;
- it is active and not canceled;
- its effective trade date is in scope;
- it arrived before the PCF cut-off or is an approved late adjustment;
- it is not already reflected in the ABOR starting quantity;
- its security and currency mappings are valid;
- its lifecycle version is the latest accepted version.

### 9.4 T−1 late trades

A trade executed on T−1 may be missing from the official starting snapshot if booked after the ABOR cut-off.

Generic rule:

```text
LateTMinus1Adjustment
  = T−1 eligible trade activity
  − activity already represented in T−1 ABOR
```

The implementation must use event IDs, accounting status, snapshot watermark, or explicit inclusion flags. Inferring “already represented” from matching quantity alone is unsafe.

### 9.5 T trades

T trades may be applied to project the basket that should represent the portfolio on T.

**CONFIGURATION REQUIRED:** Determine whether the PCF uses:

- all T trades before publication;
- only manager-approved T trades;
- only trades with a specified settlement status;
- trade-date or settlement-date recognition;
- a pre-trade target portfolio rather than live T activity.

## 10. Order processing

### 10.1 Why orders are separate

An order represents investment intent. It may exist before execution and before ABOR booking. Orders help a projected PCF reflect an intended rebalance, but introduce double-counting risk once executions arrive.

### 10.2 Order states

Typical states:

- Proposed
- Approved
- Released
- Partially Filled
- Filled
- Canceled
- Rejected
- Expired

Only configured eligible states should affect the projected PCF.

### 10.3 Remaining order quantity

```text
RemainingOrderQuantity
  = ApprovedOrderQuantity
  − CumulativeExecutedQuantity
  − CanceledQuantity
```

For a partially filled buy:

```text
Projected impact
  = Executed buy quantity from trades
  + Remaining approved buy quantity from orders
```

The filled portion must not be counted again as an order.

### 10.4 Order value

When an execution price does not exist:

```text
EstimatedOrderValueLocal
  = RemainingOrderQuantity
  × ApprovedEstimatePrice
  × PriceFactor
  × UnitFactor
```

The estimate price source may be:

- order limit price;
- latest market price;
- previous close;
- index/reference price;
- approved valuation price.

**CONFIGURATION REQUIRED:** Define the price hierarchy and stale-price tolerance.

### 10.5 Order precedence and deduplication

Recommended precedence:

1. latest valid trade execution;
2. remaining eligible order quantity;
3. ABOR position;
4. approved manual adjustment.

Link orders and trades using stable identifiers:

- parent order ID;
- execution ID;
- allocation ID;
- fund/order/security key;
- lifecycle version.

## 11. Corporate actions

Corporate actions can change position quantity, identifier, cash, entitlement, or all four.

### 11.1 Processing principle

Apply an action based on its approved accounting and PCF effective date, not merely its announcement date.

The calculation should:

1. find the entitled position;
2. determine the action lifecycle status;
3. apply quantity/security/cash transformations;
4. prevent duplicate application if ABOR already reflects the action;
5. record the action ID as lineage.

### 11.2 Stock split or reverse split

```text
NewQuantity = OldQuantity × SplitRatio
AdjustedReferencePrice = OldReferencePrice ÷ SplitRatio
```

Example: 2-for-1 split:

```text
1,000 shares → 2,000 shares
EUR 50 reference price → approximately EUR 25
```

Economic value should remain approximately unchanged, excluding market movement and rounding.

### 11.3 Cash dividend

Gross entitlement:

```text
GrossDividendReceivable
  = EntitledQuantity × DividendPerShare
```

Net entitlement:

```text
NetDividendReceivable
  = GrossDividendReceivable
  − WithholdingTax
  − ApplicableCharges
```

The equity quantity normally remains unchanged. Cash or a dividend receivable increases depending on pay-date accounting.

### 11.4 Stock dividend or bonus issue

```text
AdditionalQuantity
  = EntitledQuantity × StockDividendRatio
```

Fractional entitlements may become:

- fractional shares;
- rounded shares;
- cash in lieu.

### 11.5 Rights issue

Potential outputs include:

- a rights security;
- subscribed new shares;
- a cash payment;
- a cash-in-lieu amount.

Generic entitlement:

```text
RightsQuantity
  = EntitledQuantity × RightsRatio
```

Do not assume automatic exercise. Election status is required.

### 11.6 Merger, acquisition, or conversion

```text
NewSecurityQuantity
  = OldEntitledQuantity × ExchangeRatio
```

Possible additional component:

```text
CashConsideration
  = OldEntitledQuantity × CashPerOldShare
```

The old security is reduced or closed and the successor security is added.

### 11.7 Spin-off

```text
SpinOffQuantity
  = ParentEntitledQuantity × DistributionRatio
```

The parent usually remains unless the terms state otherwise.

### 11.8 Tender, redemption, and capital repayment

These may:

- reduce security quantity;
- create cash receivable;
- close the security;
- create a successor instrument.

### 11.9 Corporate-action controls

- action status is confirmed;
- effective date is in scope;
- election is known where required;
- entitled position date is correct;
- ratio and currency are present;
- old/new security mapping is valid;
- cash-in-lieu treatment is configured;
- action is not already reflected in ABOR;
- canceled/revised action versions are superseded.

## 12. Security normalization

### 12.1 Canonical security key

Incoming data may identify the same instrument by:

- ISIN;
- SEDOL;
- CUSIP;
- Bloomberg or Reuters identifier;
- internal security ID;
- exchange ticker;
- index constituent ID.

Use one canonical security identifier internally and preserve source identifiers as lineage.

### 12.2 Economic identity versus trading line

Two records can represent:

- the same legal security on different exchanges;
- a local ordinary share and a Depositary Receipt;
- different share classes;
- a future and its underlying index;
- a currency position and an FX-forward leg.

Do not aggregate solely because issuer names match.

### 12.3 Price and quantity factors

Reference data may supply:

- price unit or quotation basis;
- par amount;
- lot size;
- contract multiplier;
- shares-per-receipt ratio;
- currency decimals;
- nominal/value factor.

All factors must be applied before market-value comparison.

## 13. Equity positions

### 13.1 Physical equity quantity

For a physical equity in ABOR:

```text
ProjectedEquityQuantity
  = T−1 ABOR equity quantity
  + eligible signed trades
  + eligible remaining orders
  + corporate-action quantity adjustment
```

### 13.2 Fund-level market value

```text
MarketValueLocal
  = ProjectedQuantity
  × ValuationPrice
  × PriceFactor
```

```text
MarketValueBase
  = MarketValueLocal × FX(LocalCurrency → FundBaseCurrency)
```

### 13.3 Weight

```text
FundWeight
  = MarketValueBase ÷ ApplicableNetAssetValue
```

The denominator may be:

- official fund NAV;
- estimated fund NAV;
- invested assets excluding specified cash;
- synthetic target notional.

**CONFIGURATION REQUIRED:** Define the denominator per product.

### 13.4 Quantity per creation unit

When using a pro-rata holdings model:

```text
QuantityPerCU_Raw
  = ProjectedFundQuantity
  × CreationUnitShares
  ÷ FundSharesOutstanding
```

```text
QuantityPerCU
  = RoundAccordingToSecurityRule(QuantityPerCU_Raw)
```

Equivalent form:

```text
QuantityPerETFShare
  = ProjectedFundQuantity ÷ FundSharesOutstanding

QuantityPerCU
  = QuantityPerETFShare × CreationUnitShares
```

The difference caused by rounding normally flows into cash balancing.

## 14. Depositary Receipts (DRs)

### 14.1 Definition

A Depositary Receipt is a tradable instrument representing a configured number or fraction of underlying ordinary shares. Examples include ADRs and GDRs.

The PCF must determine whether it publishes:

- the DR trading line;
- the underlying ordinary share;
- a basket-policy-selected equivalent.

### 14.2 DR ratio convention

Store the ratio explicitly:

```text
UnderlyingSharesPerDR
```

Examples:

- `1 DR = 2 ordinary shares` → ratio `2`
- `1 DR = 0.5 ordinary shares` → ratio `0.5`
- `2 DR = 1 ordinary share` → ratio `0.5`

Avoid ambiguous string parsing during calculation.

### 14.3 Converting DR to underlying shares

```text
UnderlyingEquivalentQuantity
  = DRQuantity × UnderlyingSharesPerDR
```

### 14.4 Converting underlying shares to DR

```text
DREquivalentQuantity
  = UnderlyingShareQuantity ÷ UnderlyingSharesPerDR
```

### 14.5 DR value parity check

Approximate theoretical relationship:

```text
TheoreticalDRValueInDRCurrency
  = UnderlyingSharePrice
  × UnderlyingSharesPerDR
  × FX(UnderlyingCurrency → DRCurrency)
```

Observed DR price can differ because of:

- market timing;
- liquidity;
- fees;
- taxes;
- settlement;
- local-market closure;
- corporate-action processing;
- supply/demand.

### 14.6 ABOR equity versus DR position

If ABOR holds ordinary shares but the approved PCF basket requires DRs:

1. project the ordinary-share position;
2. apply corporate actions on the entitled instrument;
3. map ordinary shares to the DR;
4. divide by the underlying-shares-per-DR ratio;
5. round to the permitted DR unit;
6. send fractional/residual value to cash.

If ABOR holds DRs but the synthetic index contains ordinary shares:

1. convert the DR position to underlying-equivalent shares for exposure comparison;
2. compare economic exposure with the index target;
3. publish the instrument required by the approved basket policy.

**CONFIGURATION REQUIRED:** Define security preference when both ordinary and DR lines are available.

## 15. Physical PCF methodology

### 15.1 Full pro-rata physical basket

A full pro-rata basket scales every eligible portfolio holding to one creation unit.

```text
PCFQuantity_i
  = Round(
      ProjectedFundQuantity_i
      × CreationUnitShares
      ÷ FundSharesOutstanding
    )
```

### 15.2 Representative or optimized basket

An optimized basket may:

- include only liquid names;
- exclude restricted or unavailable securities;
- substitute cash;
- use representative sampling;
- minimize transaction costs or taxes;
- preserve portfolio risk characteristics.

The output is not derivable from ABOR quantity alone. It requires the approved basket construction algorithm and constraints.

### 15.3 Cash-only basket

For a cash creation/redemption, securities may be omitted and the basket represented by cash plus applicable fees or adjustments.

### 15.4 Ineligible positions

Common reasons a position may be excluded or cash-substituted:

- restricted market;
- non-transferable instrument;
- fractional quantity;
- local holiday;
- settlement incompatibility;
- sanction or compliance restriction;
- illiquidity;
- corporate action pending;
- security not eligible for the distribution/clearing channel;
- derivative exposure not deliverable in kind.

## 16. Synthetic PCF methodology

### 16.1 Concept

A synthetic ETF seeks index performance using derivatives, swaps, futures, collateral, or a combination rather than holding every index constituent in the same physical proportions.

For a synthetic PCF, the business-facing basket may follow the index or target economic exposure, while ABOR may contain:

- collateral securities;
- swap receivable/payable;
- cash;
- futures;
- FX forwards;
- financing and fee accruals.

Therefore:

```text
Synthetic PCF basket ≠ literal pro-rata ABOR collateral holdings
```

unless the approved methodology explicitly says otherwise.

### 16.2 Required synthetic inputs

- target index ID;
- effective index date;
- index constituents;
- constituent weights, units, or market values;
- index/reference currency;
- index level or total index market value where required;
- share-class NAV or estimated NAV;
- ETF shares outstanding;
- creation-unit size;
- security mapping;
- FX rates;
- hedge configuration;
- derivative and residual cash configuration.

### 16.3 Index-weight method

For index constituent `i`:

```text
TargetExposureBase_i
  = SyntheticBasketNetAssetBase × IndexWeight_i
```

```text
TargetQuantity_i_Raw
  = TargetExposureBase_i
  ÷ ConstituentPriceBase_i
```

```text
ConstituentPriceBase_i
  = ConstituentPriceLocal_i
  × FX(LocalCurrency_i → BaseCurrency)
  × PriceFactor_i
```

For one creation unit:

```text
SyntheticBasketNetAssetBase
  = EstimatedNAVPerShare × CreationUnitShares
```

Then:

```text
PCFQuantity_i
  = RoundAccordingToSecurityRule(TargetQuantity_i_Raw)
```

### 16.4 Index-unit method

If the index feed supplies constituent units:

```text
PCFQuantity_i_Raw
  = IndexUnits_i × ScalingFactor
```

The scaling factor aligns the total index basket value to the ETF net assets represented by one creation unit:

```text
ScalingFactor
  = SyntheticBasketNetAssetBase
  ÷ IndexBasketValueBase
```

Where:

```text
IndexBasketValueBase
  = Σ(
      IndexUnits_i
      × ConstituentPriceLocal_i
      × FX_i
      × PriceFactor_i
    )
```

### 16.5 Synthetic versus ABOR comparison

ABOR is still required for:

- fund NAV and cash;
- derivative/collateral reconciliation;
- hedge positions;
- actual fees and accruals;
- shares outstanding;
- operational controls.

The system should compare:

```text
TargetIndexExposure
versus
ActualFundEconomicExposure
```

not merely target index constituents versus ABOR physical collateral.

### 16.6 Synthetic tracking controls

- index effective date matches PCF date;
- constituent weights sum to expected total within tolerance;
- all index securities resolve;
- prices and FX are available;
- index treatment of DRs/ordinary shares is normalized;
- derivative notional supports the target exposure;
- hedge overlay is not counted as index exposure;
- residual cash reconciles to estimated NAV;
- index load completed before PCF calculation.

The rule “Do not run synthetic PCF calculation before constituent-load completion” should be enforced as a blocking control.

## 17. Currency exposure and hedging

### 17.1 Local, fund-base, and share-class currencies

Keep these currencies distinct:

- **Instrument local currency:** currency in which a constituent is valued.
- **Fund base currency:** accounting currency of the fund.
- **Share-class currency:** currency in which a share class reports NAV.
- **PCF settlement currency:** currency used for cash settlement.
- **Hedge currency:** currency pair used to offset exposure.

### 17.2 Unhedged exposure

```text
UnhedgedCurrencyExposure_c
  = SecuritiesMarketValue_c
  + Cash_c
  + Receivables_c
  − Payables_c
  + DerivativeCurrencyExposure_c
```

Converted to the hedge/reporting currency using the approved FX rate.

### 17.3 Hedge target

```text
TargetHedgeNotional_c
  = −UnhedgedCurrencyExposure_c × HedgeRatio_c
```

Examples:

- 100% hedge ratio: offset the configured exposure fully;
- 95% hedge ratio: leave 5% unhedged;
- tolerance-band approach: rebalance only outside a threshold.

### 17.4 Hedge gap

```text
HedgeGap_c
  = TargetHedgeNotional_c − ExistingHedgeNotional_c
```

Positive/negative interpretation depends on the normalized currency-leg convention.

### 17.5 Share-class hedging

A currency-hedged share class commonly has:

- the same underlying fund/index exposure as the parent fund;
- an FX-forward overlay between fund exposure currency and share-class currency;
- hedge gains/losses and forward points attributed to that share class;
- share-class-specific NAV.

Do not allocate one share class’s hedge P&L to another share class.

### 17.6 PCF treatment

Depending on basket policy, the FX hedge may be:

- shown as explicit FX-forward rows;
- represented by currency-leg cash rows;
- included only in balancing cash;
- included only in NAV/estimated NAV;
- excluded from the deliverable basket but retained in reconciliation.

**CONFIGURATION REQUIRED:** Define PCF output treatment per hedge type and share class.

## 18. FX forwards

### 18.1 Economic structure

An FX forward has two currency legs:

- buy currency and buy notional;
- sell currency and sell notional;
- agreed forward rate;
- maturity/settlement date.

Example:

```text
Buy EUR 9,200,000
Sell USD 10,000,000
Maturity 31 Jul 2026
```

### 18.2 Normalized representation

Represent both legs explicitly:

```text
BuyLegAmount  = +BuyCurrencyNotional
SellLegAmount = −SellCurrencyNotional
```

Do not collapse the forward into one notional without retaining the pair direction.

### 18.3 Forward rate

For quote `Base/Terms`:

```text
ForwardRate
  = TermsCurrencyAmount ÷ BaseCurrencyAmount
```

The application must store the quote convention. A bare numeric rate is insufficient.

### 18.4 Simplified valuation

One generic base-currency approximation is:

```text
ForwardMTM_Base
  = PV(BuyLeg converted to base)
  + PV(SellLeg converted to base)
```

Or, when the trade and current forward rates use the same convention:

```text
ForwardMTM_Terms
  ≈ BaseNotional × (CurrentForwardRate − ContractForwardRate)
```

The sign depends on whether the fund buys or sells the base currency. Production valuation should use the approved pricing service, discount factors, curves, and sign convention rather than this approximation.

### 18.5 FX-forward PCF fields

Potential fields:

- instrument type;
- currency pair;
- buy currency;
- buy amount;
- sell currency;
- sell amount;
- contract rate;
- current forward rate;
- maturity date;
- market value;
- unrealized P&L;
- share-class attribution;
- hedge purpose;
- source trade ID.

### 18.6 Rolling a hedge

On hedge roll:

1. old forward approaches maturity or is closed;
2. settlement cash or realized P&L is recognized;
3. new forward is opened;
4. new contract notional reflects updated exposure;
5. old and new contracts must not both be treated as continuing hedge notional after the old contract terminates.

### 18.7 FX-forward controls

- both currency legs exist;
- pair direction is valid;
- notionals reconcile through contract rate within tolerance;
- maturity is valid;
- lifecycle status is current;
- old/reversed trades are excluded;
- share-class attribution is present;
- valuation source and timestamp are present;
- hedge notional does not duplicate spot cash exposure.

## 19. Futures

### 19.1 Why futures require special treatment

A futures position is stored as a number of contracts, but its economic exposure depends on:

- underlying price;
- contract multiplier;
- contract currency;
- position sign;
- FX rate;
- delta, where applicable.

The contract’s market value and its economic notional are different concepts.

### 19.2 Futures notional

```text
FuturesNotionalLocal
  = NumberOfContracts
  × FuturesPrice
  × ContractMultiplier
  × Delta
```

For standard linear index futures, delta is often approximately 1 for a long and sign is carried by contract quantity.

```text
FuturesNotionalBase
  = FuturesNotionalLocal
  × FX(ContractCurrency → FundBaseCurrency)
```

### 19.3 Exposure sign

| Position | Contracts sign | Exposure |
| --- | ---: | --- |
| Long future | Positive | Positive underlying exposure |
| Short future | Negative | Negative underlying exposure |

### 19.4 Number of contracts for a target exposure

```text
RequiredContracts_Raw
  = TargetExposureLocal
  ÷ (FuturesPrice × ContractMultiplier × Delta)
```

```text
RequiredContracts
  = RoundToWholeContract(RequiredContracts_Raw)
```

Residual exposure:

```text
ResidualExposure
  = TargetExposureLocal
  − RequiredContracts
    × FuturesPrice
    × ContractMultiplier
    × Delta
```

Residual exposure may remain as cash or another hedge instrument.

### 19.5 Variation margin

Exchange-traded futures are generally marked to market. Daily gain/loss appears as variation margin cash:

```text
VariationMargin
  = Contracts
  × (CurrentSettlementPrice − PreviousSettlementPrice)
  × ContractMultiplier
```

Sign follows long/short position convention.

Avoid counting both:

- the full futures notional as an asset market value; and
- variation margin as if it were an independent exposure.

### 19.6 PCF treatment

A futures position may be:

- an explicit derivative component;
- replaced by cash collateral in the deliverable basket;
- converted to underlying-equivalent exposure for synthetic comparison;
- omitted from in-kind constituents but included in NAV and cash reconciliation.

**CONFIGURATION REQUIRED:** Define the derivative-delivery and cash-substitution policy.

### 19.7 Futures roll

During a roll:

- expiring contracts are reduced/closed;
- next-expiry contracts are opened;
- both may temporarily exist;
- net economic exposure, not gross contract count, must be compared with target;
- realized P&L and variation margin affect cash.

### 19.8 Futures controls

- contract multiplier exists;
- expiry and contract month are correct;
- latest valid settlement/valuation price exists;
- expired contracts are excluded or handled correctly;
- contract currency FX exists;
- contract quantity is integral;
- long/short sign is valid;
- roll trades are not double counted;
- notional is separated from accounting market value.

## 20. NAV, estimated NAV, NOSH, and creation-unit scaling

### 20.1 Net asset value

Simplified fund NAV:

```text
FundNetAssets
  = SecuritiesMarketValue
  + Cash
  + Receivables
  + DerivativeMarketValue
  + AccruedIncome
  − Payables
  − AccruedExpenses
  − OtherLiabilities
```

### 20.2 NAV per share

```text
NAVPerShare
  = FundOrShareClassNetAssets
  ÷ SharesOutstanding
```

### 20.3 Estimated NAV

Estimated NAV rolls the latest official NAV or underlying assets forward using current available prices, FX, transactions, accruals, derivative values, and share activity.

Generic form:

```text
EstimatedNetAssets_T
  = OfficialNetAssets_T−1
  + MarketMovement
  + FXMovement
  + TradeAndOrderEffects
  + CorporateActionEffects
  + Income
  − FeesAndExpenses
  + DerivativePnL
  + Subscriptions
  − Redemptions
```

```text
EstimatedNAVPerShare_T
  = EstimatedNetAssets_T ÷ EstimatedSharesOutstanding_T
```

### 20.4 Number of shares outstanding

```text
EstimatedSharesOutstanding_T
  = ClosingSharesOutstanding_T−1
  + ConfirmedCreatedShares_T
  − ConfirmedRedeemedShares_T
  + OtherApprovedShareAdjustments_T
```

For a pre-market T PCF, the applicable shares figure may still be T−1 final NOSH.

**CONFIGURATION REQUIRED:** Define which shares figure is used and its cut-off.

### 20.5 NAV represented by one creation unit

```text
NAVPerCreationUnit
  = NAVPerShare × CreationUnitShares
```

This is the primary value against which the rounded constituent basket and cash component are reconciled.

## 21. Cash component and balancing

### 21.1 Purpose

Security quantities are rounded and some fund assets cannot or should not be delivered in kind. A cash component bridges the difference between:

- the net asset value represented by one creation unit; and
- the value of deliverable basket securities and explicit non-security components.

### 21.2 Generic balancing formula

```text
BalancingCashBase
  = NAVPerCreationUnit
  − Σ(PCFConstituentMarketValueBase)
  − ExplicitDerivativeValueBase
  − ExplicitAccrualComponentsBase
  − OtherExplicitBasketAssetsBase
  + ExplicitBasketLiabilitiesBase
```

Sign convention must be documented:

- positive may mean AP pays cash to the fund;
- negative may mean fund pays cash to the AP.

### 21.3 Cash by currency

If the PCF publishes multi-currency cash:

```text
CashComponent_c
  = ProjectedCash_c
  × CreationUnitShares
  ÷ SharesOutstanding
```

Rounding and an additional base-currency balancing line may still be required.

### 21.4 Estimated T−1 cash

Some schemas distinguish estimated cash based on T−1 data from final cash. Treat it as a separate field with its own timestamp and status.

### 21.5 Transaction fees

Creation/redemption fees may be:

- a fixed fee;
- a variable fee;
- outside the NAV balancing equation;
- embedded in the cash component;
- different for creation and redemption.

**CONFIGURATION REQUIRED:** Do not infer fee treatment from balancing cash alone.

## 22. PCF field dictionary and calculation rules

The exact file schema must be mapped to the target distributor. The following canonical model separates header, constituent, derivative, and cash fields.

### 22.1 Header fields

| Field | Meaning | Source/calculation | Required controls |
| --- | --- | --- | --- |
| `pcfId` | Unique PCF snapshot ID | Generated from fund/share class, date, cycle, version | Unique and immutable |
| `fundId` | Internal fund identifier | Fund master | Must resolve |
| `shareClassIsin` | ETF/share-class ISIN | Security/fund master | Valid ISIN where applicable |
| `fundName` | Display name | Fund master | Active on PCF date |
| `pcfDate` | Date basket is valid | Processing calendar | Business-day validation |
| `valuationDate` | Date/time of value inputs | NAV/pricing configuration | Not after prohibited cut-off |
| `publicationTimestamp` | Snapshot publication time | System clock | Time zone included |
| `version` | PCF revision | Increment on republish | Latest version identifiable |
| `cycle` | Primary/secondary/intraday cycle | Distribution configuration | Allowed value |
| `basketType` | Physical, synthetic, optimized, custom, cash | Fund basket policy | Matches approved method |
| `fundBaseCurrency` | Fund accounting currency | Fund master | ISO currency |
| `shareClassCurrency` | Share-class NAV currency | Share-class master | ISO currency |
| `settlementCurrency` | Cash settlement currency | PCF configuration | ISO currency |
| `creationUnitShares` | ETF shares per creation unit | Fund/PCF configuration | Positive integer |
| `sharesOutstanding` | Applicable NOSH | Shares service | Date and status present |
| `navPerShare` | Official or estimated NAV/share | NAV service or calculation | Status identifies official/estimated |
| `navPerCreationUnit` | NAV represented by CU | `navPerShare × creationUnitShares` | Reconciles to basket |
| `componentCount` | Number of published components | Count after filters | Equals output rows |
| `status` | Draft, validated, published, failed | Workflow state | Legal transitions only |

### 22.2 Constituent fields

| Field | Meaning | Source/calculation | Required controls |
| --- | --- | --- | --- |
| `componentId` | Component row ID | Generated | Unique within PCF |
| `canonicalSecurityId` | Internal canonical ID | Security master mapping | Must resolve |
| `isin` | Component ISIN | Security master | Required if instrument has ISIN |
| `sedol/cusip/ticker` | Alternate identifiers | Security master | Market-consistent |
| `securityName` | Display name | Security master | Effective-dated |
| `instrumentType` | Equity, DR, future, forward, cash, etc. | Security classification | Approved taxonomy |
| `country` | Risk/listing/incorporation country | Defined reference field | Definition documented |
| `localCurrency` | Valuation/trading currency | Security master/price | Valid ISO currency |
| `positionSource` | ABOR, index, order, derivative, adjustment | Lineage | Non-null |
| `aborQuantityTMinus1` | Starting accounting quantity | ABOR snapshot | Snapshot timestamp |
| `tradeQuantity` | Eligible signed trade impact | Trade aggregation | No duplicates |
| `orderQuantity` | Remaining eligible order impact | Order aggregation | Filled portion excluded |
| `corporateActionQuantity` | Net CA quantity change | CA engine | Action IDs retained |
| `projectedFundQuantity` | Rolled fund quantity | Sum of applicable quantity terms | Waterfall reconciles |
| `quantityPerETFShare` | Quantity for one ETF share | `projectedFundQuantity / sharesOutstanding` | Shares > 0 |
| `rawQuantityPerCU` | Unrounded CU quantity | `projectedFundQuantity × CU / sharesOutstanding` or synthetic target | Method recorded |
| `publishedQuantity` | Deliverable component quantity | Rounded/substituted raw quantity | Rounding rule recorded |
| `price` | Approved valuation price | Pricing service | Date/source/status |
| `priceFactor` | Quote/unit adjustment | Security master | Positive and effective |
| `fxRateToBase` | Local-to-base conversion | FX service | Pair and direction stored |
| `marketValueLocal` | Local row value | `publishedQuantity × price × priceFactor` | Numeric tolerance |
| `marketValueBase` | Base row value | `marketValueLocal × fxRateToBase` | Recalculable |
| `weight` | Row weight | `marketValueBase / applicable net assets` | Sum control |
| `roundingResidualBase` | Value lost/gained through rounding | `(raw − published qty) × price × factor × FX` | Included in balance |
| `cashInLieu` | Row replaced by cash | Eligibility/rounding rule | Reason code required |
| `exclusionReason` | Why row not deliverable | Basket policy | Approved reason |

### 22.3 DR-specific fields

| Field | Meaning | Calculation/source |
| --- | --- | --- |
| `drType` | ADR, GDR, or other receipt | Security master |
| `underlyingSecurityId` | Ordinary-share security | Security master relationship |
| `underlyingSharesPerDR` | Economic ratio | Corporate action/security master |
| `underlyingEquivalentQuantity` | Ordinary-share equivalent | `DR quantity × underlyingSharesPerDR` |
| `preferredBasketLine` | DR or ordinary share | Basket configuration |

### 22.4 Futures fields

| Field | Meaning | Calculation/source |
| --- | --- | --- |
| `contractCode` | Futures instrument | Security master |
| `underlyingIndexId` | Referenced index | Security master |
| `expiryDate` | Contract expiry | Security master |
| `numberOfContracts` | Signed position | ABOR + activity |
| `contractMultiplier` | Exposure per index point | Security master |
| `futuresPrice` | Approved futures price | Pricing service |
| `delta` | Exposure factor | Product model |
| `notionalLocal` | Economic exposure | contracts × price × multiplier × delta |
| `notionalBase` | Base exposure | notional local × FX |
| `variationMargin` | Daily settled P&L | contracts × price change × multiplier |

### 22.5 FX-forward fields

| Field | Meaning | Calculation/source |
| --- | --- | --- |
| `forwardId` | Contract ID | Trade/ABOR |
| `shareClassId` | Hedge attribution | Hedge system |
| `buyCurrency` | Currency received | Contract |
| `buyAmount` | Positive buy notional | Contract |
| `sellCurrency` | Currency delivered | Contract |
| `sellAmount` | Positive absolute sell notional | Contract |
| `contractForwardRate` | Agreed rate | Contract |
| `currentForwardRate` | Valuation rate | FX pricing |
| `maturityDate` | Settlement date | Contract |
| `marketValueBase` | Current MTM | Approved valuation service |
| `hedgePurpose` | Share-class, portfolio, equitization | Hedge configuration |
| `lifecycleStatus` | Open, closing, matured, canceled | Trade lifecycle |

### 22.6 Cash and summary fields

| Field | Meaning | Source/calculation |
| --- | --- | --- |
| `cashCurrency` | Currency of cash line | ABOR/configuration |
| `projectedCash` | Rolled fund cash | ABOR + cash activity |
| `cashPerCU` | Pro-rata cash | projected cash × CU / shares outstanding |
| `accruedIncomePerCU` | Pro-rata eligible income accrual | accrual × CU / shares |
| `accruedExpensePerCU` | Pro-rata eligible expense | expense × CU / shares |
| `derivativeValuePerCU` | Pro-rata derivative MTM | derivative MTM × CU / shares |
| `balancingCash` | NAV minus explicit basket values | balancing equation |
| `fixedFee` | Fixed create/redeem fee | fee schedule |
| `variableFee` | Variable create/redeem charge | fee model |
| `totalBasketValue` | Securities + explicit cash/assets − liabilities | sum |
| `reconciliationDifference` | Basket value versus NAV/CU | total basket value − NAV/CU |

## 23. Worked example: physical equity PCF

Assume:

- T−1 ABOR position: 1,000,000 shares;
- T late buy not in ABOR: 20,000 shares;
- T sell execution: 10,000 shares;
- approved buy order: 15,000 shares;
- 5,000 shares of that order are already represented by the buy execution;
- no corporate action;
- shares outstanding: 10,000,000 ETF shares;
- creation unit: 100,000 ETF shares;
- constituent price: EUR 25;
- fund base currency: EUR.

Remaining order:

```text
15,000 − 5,000 = 10,000
```

Projected fund quantity:

```text
1,000,000 + 20,000 − 10,000 + 10,000 = 1,020,000
```

Raw quantity per CU:

```text
1,020,000 × 100,000 ÷ 10,000,000 = 10,200
```

Market value per CU:

```text
10,200 × EUR 25 = EUR 255,000
```

If the security only permits whole shares, published quantity remains 10,200.

## 24. Worked example: ordinary share to DR

Assume:

- projected ABOR ordinary-share position: 600,000;
- 1 DR represents 2 ordinary shares;
- shares outstanding: 12,000,000;
- creation unit: 100,000;
- PCF policy publishes the DR.

DR-equivalent fund quantity:

```text
600,000 ÷ 2 = 300,000 DRs
```

DR quantity per CU:

```text
300,000 × 100,000 ÷ 12,000,000 = 2,500 DRs
```

The output is 2,500 DRs per creation unit before any basket-specific substitution.

## 25. Worked example: synthetic index basket

Assume:

- estimated NAV per ETF share: EUR 50;
- creation unit: 100,000 shares;
- NAV represented by CU: EUR 5,000,000;
- constituent A index weight: 4%;
- constituent A local price: USD 100;
- FX convention gives `1 USD = 0.92 EUR`;
- price factor: 1.

Target base exposure:

```text
EUR 5,000,000 × 4% = EUR 200,000
```

Constituent price in EUR:

```text
USD 100 × 0.92 = EUR 92
```

Raw target quantity:

```text
EUR 200,000 ÷ EUR 92 = 2,173.913043 shares
```

If whole shares are required:

```text
Published quantity = 2,174
```

Published value:

```text
2,174 × EUR 92 = EUR 200,008
```

Rounding difference:

```text
EUR 200,000 − EUR 200,008 = −EUR 8
```

The EUR 8 excess is offset in basket balancing cash, subject to the configured sign convention.

## 26. Worked example: futures exposure

Assume:

- target exposure: EUR 4,000,000;
- futures price: 4,500 index points;
- multiplier: EUR 10 per point;
- delta: 1.

Exposure per contract:

```text
4,500 × EUR 10 = EUR 45,000
```

Raw contracts:

```text
EUR 4,000,000 ÷ EUR 45,000 = 88.8889
```

If rounded to 89 contracts:

```text
89 × EUR 45,000 = EUR 4,005,000
```

Residual:

```text
EUR 4,000,000 − EUR 4,005,000 = −EUR 5,000
```

The negative residual indicates the rounded futures exposure is EUR 5,000 above target and must be recognized in residual cash/exposure controls.

## 27. Worked example: share-class FX hedge

Assume:

- USD exposure attributable to an EUR-hedged share class: USD 10,000,000;
- target hedge ratio: 100%;
- existing open forward sells USD 9,700,000;
- no other USD hedge.

Target hedge:

```text
−USD 10,000,000
```

Existing hedge:

```text
−USD 9,700,000
```

Hedge gap:

```text
−USD 10,000,000 − (−USD 9,700,000)
= −USD 300,000
```

The share class needs to sell approximately an additional USD 300,000 forward, subject to tolerance, dealing lot, and approved hedge rules.

## 28. Calculation lineage

Every output field should be explainable through lineage.

Minimum lineage for a constituent:

```text
PCF snapshot
  → calculation method and configuration version
  → starting ABOR record
  → included trade IDs
  → included order IDs and remaining quantities
  → corporate-action IDs
  → security mapping and factors
  → price record
  → FX record
  → shares outstanding
  → creation-unit size
  → rounding rule
  → cash-balancing contribution
```

For a synthetic constituent:

```text
PCF snapshot
  → index ID and effective date
  → index constituent/weight/unit
  → estimated NAV
  → price
  → FX
  → scaling factor
  → rounding
  → cash residual
```

For a hedge:

```text
PCF snapshot
  → share class
  → calculated currency exposure
  → target hedge ratio
  → existing forward contracts
  → current forward valuation
  → hedge gap
```

## 29. Validation framework

### 29.1 Completeness checks

- ABOR T−1 snapshot received.
- NAV or estimated NAV available.
- shares outstanding available.
- creation-unit size configured.
- all required trade/order topics complete to watermark.
- security master records available.
- prices and FX rates available.
- corporate-action feed complete.
- index data complete for synthetic funds.
- derivative records complete.

### 29.2 Referential checks

- fund and share class resolve;
- every security maps to canonical ID;
- DR underlying and ratio resolve;
- future multiplier and expiry resolve;
- FX-forward currencies and share class resolve;
- index constituent maps to security master.

### 29.3 Arithmetic checks

- projected quantity equals the calculation waterfall;
- weights sum within expected tolerance;
- index weights sum within expected tolerance;
- market value recalculates from quantity, price, factor, and FX;
- forward legs reconcile through rate within tolerance;
- futures notional recalculates;
- NAV per CU recalculates;
- basket plus cash reconciles to NAV per CU.

### 29.4 Temporal checks

- no future-dated data is used unintentionally;
- all inputs have allowed timestamps;
- index and corporate-action effective dates match;
- prices and FX meet freshness tolerance;
- derivative lifecycle status is current;
- PCF version is the latest publishable snapshot.

### 29.5 Business checks

- restricted securities are handled per policy;
- fractional positions follow rounding/cash rules;
- trade/order overlap is removed;
- corporate action is not double-applied;
- expired futures are handled;
- matured forwards are handled;
- hedge belongs to the correct share class;
- synthetic calculation waits for full index load;
- negative or extreme cash is explained;
- material day-over-day deltas have a reason.

## 30. Day-over-day delta explanations

The copilot should classify every material PCF change into one or more causes:

- ABOR position change;
- booked buy/sell;
- remaining order;
- order cancellation;
- corporate action;
- index rebalance/reconstitution;
- share-count change;
- creation-unit configuration change;
- price movement;
- FX movement;
- DR ratio/security mapping change;
- futures roll;
- FX-forward roll or hedge rebalance;
- NAV/accrual/fee change;
- rounding/cash substitution;
- manual approved adjustment;
- corrected or late source data.

Example answer:

> The PCF quantity for Security A increased from 10,000 to 10,250 units. The change consists of a 20,000-share fund-level buy and a 5,000-share remaining approved order, scaled across 10 million ETF shares into a 100,000-share creation unit. No corporate action was applied.

## 31. Common incident scenarios

### 31.1 Missing index constituents

**Symptom:** Synthetic PCF is empty or calculation fails.

**Likely cause:** Index Data Service returned no constituents for the effective date.

**Business impact:** Synthetic fund basket cannot be generated or published.

**Control:** Block calculation before constituent-load completion.

### 31.2 PCF quantity doubled

**Likely causes:**

- order quantity and executed trade both fully applied;
- corporate action applied after ABOR already reflected it;
- duplicate trade lifecycle versions;
- duplicate ABOR records.

### 31.3 Unexpected negative cash

**Likely causes:**

- large buy/order activity;
- rounding overshoot;
- missing sell proceeds;
- FX quote direction reversed;
- dividend/payable sign error;
- derivative MTM included twice;
- wrong NAV or shares outstanding.

### 31.4 DR quantity incorrect by a fixed factor

**Likely causes:**

- DR ratio inverted;
- ratio effective date missed;
- ordinary and DR quantities aggregated without conversion;
- corporate action changed the ratio.

### 31.5 Synthetic PCF does not follow index

**Likely causes:**

- stale index date;
- incomplete constituent load;
- weights versus units interpreted incorrectly;
- stale price/FX;
- wrong scaling NAV;
- ordinary/DR mapping mismatch;
- hedge overlay counted as index exposure;
- constituent exclusion/substitution.

### 31.6 Hedge amount unexpectedly changes

**Likely causes:**

- share-class NAV or subscriptions/redemptions changed;
- underlying currency exposure changed;
- hedge ratio changed;
- old forward matured;
- roll booked twice;
- forward assigned to wrong share class;
- FX conversion direction changed.

### 31.7 Futures exposure does not reconcile

**Likely causes:**

- missing/incorrect contract multiplier;
- contract quantity sign error;
- old and new roll contracts both counted incorrectly;
- futures notional confused with accounting market value;
- variation margin double counted;
- stale settlement price.

## 32. Copilot question-answer rules

### 32.1 Questions the knowledge base should support

- How was this PCF quantity calculated?
- Why did this security quantity change from yesterday?
- Which trades and orders affected the position?
- Was a corporate action applied?
- Why is the cash component negative?
- How was the DR quantity derived from the ordinary-share position?
- How does this synthetic PCF follow the index?
- Why does the synthetic PCF differ from ABOR holdings?
- How was the FX hedge calculated?
- Which FX forwards belong to this share class?
- How was the futures exposure calculated?
- Why did NAV and PCF basket value differ?
- Which source event caused publication to fail?

### 32.2 Required response format

For a calculation question, respond in this order:

1. **Answer:** one-sentence business explanation.
2. **Calculation:** formula with actual values.
3. **Sources:** input systems, IDs, and timestamps.
4. **Business impact:** if the discrepancy blocks or changes publication.
5. **Confidence:** high, medium, or low with reason.
6. **Next action:** only when needed.

### 32.3 Example copilot answer

> **Answer:** The PCF quantity increased because a T buy and the unfilled remainder of an approved order were added to the T−1 ABOR position.
>
> **Calculation:** `(1,000,000 ABOR + 20,000 buy + 10,000 remaining order) × 100,000 CU ÷ 10,000,000 shares = 10,300 units`.
>
> **Sources:** ABOR snapshot `2026-07-23 EOD`; trade `TRD-1842`; order `ORD-771`; shares snapshot `NOSH-20260724`.
>
> **Confidence:** High. All source records are complete and the basket reconciles to NAV within tolerance.

### 32.4 Safety rules

The copilot must not:

- claim that an order is executed when only approved;
- claim a corporate action is effective from announcement alone;
- infer DR ratio from price;
- use a stale index without disclosure;
- treat futures notional as cash market value;
- value a forward from spot alone when forward valuation is required;
- mix share-class hedge exposure;
- hide missing data behind a high-confidence answer;
- recommend automatic republishing without validation and authorization.

## 33. Data freshness and precedence

Suggested source precedence:

| Data | Preferred source | Fallback |
| --- | --- | --- |
| Official position | ABOR final snapshot | Approved prior snapshot plus activity |
| Executed activity | Latest valid trade lifecycle | None |
| Unexecuted intent | Latest eligible order lifecycle | Exclude if status uncertain |
| Security attributes | Effective-dated security master | Approved override |
| Corporate action | Confirmed CA record | Manual approved instruction |
| Index | Official effective-date snapshot | No silent fallback |
| Price | Approved valuation source | Configured hierarchy |
| FX | Approved FX source | Configured hierarchy |
| NAV | Official final NAV | Clearly labeled estimated NAV |
| Futures multiplier | Security master/contract spec | No inferred multiplier |
| Forward MTM | Approved derivative valuation | Clearly labeled estimate |

Every fallback must be visible in lineage and confidence.

## 34. Configuration register

The following entries must be completed for production:

| Configuration | Required decision |
| --- | --- |
| ABOR basis | Trade-date or settlement-date accounting |
| Starting snapshot | Exact T−1 status and cut-off |
| Late T−1 activity | Inclusion and deduplication logic |
| T trades | Which statuses and cut-off apply |
| Orders | Eligible states and filled-quantity handling |
| Corporate actions | Ex/effective/pay-date treatment |
| Synthetic method | Weight, unit, or other scaling method |
| Physical method | Pro-rata, optimized, custom, or cash |
| Security preference | Ordinary share versus DR |
| DR ratio | Source and effective-date rule |
| Futures treatment | Explicit row, exposure-only, or cash substitution |
| FX forwards | Explicit rows, cash legs, or NAV-only |
| Hedge ratio | Fund/share-class rule and tolerance |
| Price hierarchy | Source priority and staleness |
| FX convention | Pair direction and triangulation |
| NAV status | Official versus estimated hierarchy |
| NOSH | Applicable snapshot and timing |
| Creation unit | Effective-dated CU size |
| Quantity rounding | Asset-class-specific precision |
| Cash sign | AP-to-fund or fund-to-AP convention |
| Fee treatment | Inside/outside balancing cash |
| Reconciliation tolerance | Warning and blocking thresholds |
| Publication | Primary/secondary cycle and versioning |

## 35. Suggested RAG metadata

When chunking this document, attach:

```json
{
  "domain": "ETF-PCF",
  "product": "Application Intelligence Copilot",
  "documentType": "business-rule-knowledge-base",
  "version": "1.0-draft",
  "approvalStatus": "review-required",
  "effectiveDate": null,
  "owner": "PCF Data Product Team",
  "topics": [
    "ABOR",
    "trades",
    "orders",
    "corporate-actions",
    "synthetic-PCF",
    "physical-PCF",
    "equity",
    "depositary-receipts",
    "FX-hedging",
    "FX-forwards",
    "futures",
    "NAV",
    "NOSH",
    "cash-balancing"
  ]
}
```

Recommended chunk boundaries:

- one complete numbered subsection per chunk;
- keep each formula with its definitions;
- keep each worked example intact;
- attach version and approval status to every chunk;
- rank approved internal rules above this generic draft;
- do not mix two versions of a business rule without effective dates.

## 36. Glossary

| Term | Meaning |
| --- | --- |
| ABOR | Accounting Book of Record |
| AP | Authorized Participant |
| Basket | Securities/cash delivered or received for ETF creation/redemption |
| Cash component | Cash bridging basket assets and NAV represented by a creation unit |
| Creation unit (CU) | Standard block of ETF shares created/redeemed in the primary market |
| DR | Depositary Receipt |
| ETF | Exchange-Traded Fund |
| FX forward | Agreement to exchange currencies at a future date and agreed rate |
| Hedge ratio | Proportion of currency exposure intended to be offset |
| Index units | Constituent units in a reference index basket |
| NAV | Net Asset Value |
| NOSH | Number of Shares Outstanding |
| PCF | Portfolio Composition File |
| Physical ETF | ETF obtaining exposure primarily through held securities |
| Synthetic ETF | ETF obtaining exposure partly or primarily through derivatives |
| T | Current PCF trade/publication date |
| T−1 | Previous applicable business day |
| Variation margin | Daily cash settlement of futures gains/losses |

## 37. External reference basis

These public sources support the general PCF and ETF basket concepts used in this draft. They do not define the institution-specific calculation waterfall:

- DTCC ETF Portfolio Data overview: https://www.dtcc.com/-/media/Files/Downloads/Data-Services/dtccdata/Exchange-Traded-Funds-Data-Overview.pdf
- DTCC ETF processing: https://www.dtcc.com/clearing-and-settlement-services/equities-trade-capture/etf
- DTCC ETF PCF file specification: https://www.dtcc.com/-/media/Files/Downloads/Data-Services/dtccdata/ETF-PCF-and-Near-RealTime-Supplemental-File-Specification-%282%29.pdf
- SEC discussion of ETF creation and redemption baskets: https://www.sec.gov/rules-regulations/2001/11/actively-managed-exchange-traded-funds
- BlackRock/iShares SAI discussion of PCF, Fund Data Files, and baskets: https://www.blackrock.com/us/individual/literature/sai/sai-ishares-trust-10-31.pdf

## 38. Review checklist

Before approval, PCF business and operations owners should confirm:

- [ ] exact T−1/T event order;
- [ ] ABOR accounting basis;
- [ ] five Kafka topic meanings and watermarks;
- [ ] order/trade deduplication identifiers;
- [ ] corporate-action inclusion dates;
- [ ] physical PCF basket policy;
- [ ] synthetic index scaling formula;
- [ ] ordinary-share/DR preference and ratio source;
- [ ] FX quote direction and triangulation;
- [ ] share-class hedge attribution;
- [ ] FX-forward output and valuation treatment;
- [ ] futures output, notional, and variation-margin treatment;
- [ ] official versus estimated NAV hierarchy;
- [ ] NOSH and creation-unit timing;
- [ ] constituent rounding rules;
- [ ] cash-component sign and fee treatment;
- [ ] reconciliation tolerances;
- [ ] file field names and downstream schema;
- [ ] failure severity and republish authorization.

Only after these are confirmed should `status: review-required` be changed to an approved status.

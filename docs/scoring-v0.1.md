# KaggleScope scoring methodology v0.1

KaggleScope scores are unofficial, relative indicators calculated from public Meta Kaggle data. They are not Kaggle ratings or official rankings.

## Valid competition results

One result is retained per Kaggler and competition. Private Leaderboard Rank is preferred; Public Leaderboard Rank is used only when the private rank is unavailable. A result is excluded when any of the following applies:

- the team is a benchmark;
- the competition has no leaderboard;
- rank or total team count is missing or non-positive;
- rank exceeds the total team count;
- neither competition deadline nor medal award date is available; or
- the result date is later than the calculation date.

The result date is the medal award date when available, otherwise the competition deadline.

## Result Score

```text
percentile = rank / total_teams
placement_score = 100 * (1 - percentile)^2
size_weight = clamp(log10(max(total_teams, 10)) / 3, 0.5, 1.25)
medal_bonus = Gold 30, Silver 15, Bronze 5, None 0
result_score = (placement_score + medal_bonus) * size_weight
```

## Career Power

For each Kaggler, results are ordered by Result Score:

```text
career_raw = sum(top 10 result scores) + 0.25 * sum(remaining scores)
```

Raw scores are converted to a 0–100 relative score across all target Kagglers. The best raw rank maps to 100 and the last rank maps to 0. Ties use the best shared rank. A population where every raw score is zero receives a power of zero.

## Solo Power

Solo Power uses the Career Power calculation with results where `team_size == 1`. A Kaggler needs at least three solo results; otherwise the score and rank are unavailable.

## Consistency Score

A Kaggler needs at least five valid results.

```text
consistency_raw = (
  0.4 * top_10_percent_rate
  + 0.3 * top_25_percent_rate
  + 0.3 * (1 - median_percentile)
) * min(1, sqrt(competition_count / 10))
```

Eligible raw scores are converted to a relative 0–100 score using the same ranking rule as Career Power.

## Momentum Score

Momentum includes results from the 365 days ending on the calculation date:

```text
weight = exp(-days_since_result / 180)
momentum_raw = sum(result_score * weight)
```

Raw scores are converted to a relative 0–100 score across all target Kagglers. Future-dated results are excluded.

## Versioning and snapshots

Calculated score rows carry `score_version = "0.1"`. Every successful run upserts a UTC-date ranking snapshot containing official rank, official points, Career Power, and Career Rank. Re-running the same source data and calculation date is idempotent.

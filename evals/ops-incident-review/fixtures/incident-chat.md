# #incident-orders — Tuesday 14 October

**13:58 Dave:** running the orders schema migration on staging now
**13:58 Dave:** `deploy migrate --env prod orders_2026_10_add_index`
**13:59 deploy-bot:** ✅ migration orders_2026_10_add_index applied to **prod** (took 41s)
**14:02 (no messages — error rate on checkout starts climbing)**
**14:09 Priya (support):** customers saying checkout spins and fails, anyone seeing this?
**14:14 PagerDuty:** 🔴 TRIGGERED — CheckoutErrorRateHigh (error rate > 5% for 10 min)
**14:15 Sam (on call):** ack, looking
**14:17 Sam:** orders table locked, the new index build is blocking writes
**14:18 Dave:** oh no — that was meant for staging. the command is the same for both envs, I had the wrong --env
**14:19 Sam:** following the rollback runbook step 3: `./scripts/rollback-migration.sh`
**14:20 Sam:** script not found — looks like it was removed when we moved to the new deploy tool in August
**14:24 Lena (eng lead):** let's restore orders from the 13:55 snapshot, I'll do it
**14:31 Lena:** restore started
**14:38 Lena:** restore done, writes flowing
**14:42 Sam:** checkout error rate back under 0.1%, watching
**14:45 Sam:** resolved. ~40 min of failed checkouts. 3 orders placed 13:55–13:59 need re-entering from the payment provider

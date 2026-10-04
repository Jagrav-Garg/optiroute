from concurrent.futures import ThreadPoolExecutor

import pytest

from optiroute.budget import BudgetExceeded, BudgetLedger


def test_parallel_reservations_cannot_exceed_project_cap(tmp_path):
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.02, 0.03)

    def attempt(index):
        try:
            ledger.reserve(str(index), "specialist", "paid-model", 0.01)
            return True
        except BudgetExceeded:
            return False

    with ThreadPoolExecutor(max_workers=8) as pool:
        accepted = list(pool.map(attempt, range(12)))
    assert sum(accepted) == 3
    assert ledger.summary()["project_accounted_usd"] <= 0.03


def test_uncertain_charge_survives_restart_and_blocks_further_spend(tmp_path):
    path = tmp_path / "spend.sqlite"
    ledger = BudgetLedger(path, 0.01, 0.03)
    identifier = ledger.reserve("trip", "planner", "paid-model", 0.01)
    restarted = BudgetLedger(path, 0.01, 0.03)
    with pytest.raises(BudgetExceeded):
        restarted.reserve("trip", "planner", "paid-model", 0.001)
    restarted.settle(identifier, 0.002, {"prompt_tokens": 100})
    restarted.reserve("trip", "planner", "paid-model", 0.005)
    assert restarted.summary("trip")["run_accounted_usd"] == 0.007


@pytest.mark.parametrize("amount", [-1, float("nan"), float("inf")])
def test_invalid_prices_are_rejected(tmp_path, amount):
    ledger = BudgetLedger(tmp_path / "spend.sqlite", 0.01, 0.03)
    with pytest.raises(ValueError):
        ledger.reserve("trip", "planner", "model", amount)


function BeforeAct(AO, RO, E, O) {
	if (O.Value.length === 6) {
		for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
			if (RO.Card.Value.length === 6) {
				AO.ShowMessage("Бонусная карта уже введена!");
				AO.Cancel();
			}
		}
	}
	else if (O.Value.length === 8) {
		for (O.Classifier.Index = 1; O.Classifier.Index <= O.Classifier.Count; O.Classifier.Index ++) {
			if (O.Classifier.Code === 1) {
				AO.ShowMessage("С сертификата уже списывались средства!");
				AO.Cancel();
			}
		}
	}
}

function AfterAct(AO, RO, E, O) {
	if (O.Value.length !== 6) {
		return 0;
	}

	var bonusSumm = 0;
	var buySumm = 0;
	var cardLevel = 1;
	for (O.Counter.Index = 1; O.Counter.Index <= O.Counter.Count; O.Counter.Index ++) {
		if (O.Counter.TypeCode === 1) {
			bonusSumm = Math.floor(O.Counter.Value);
		}
		else if (O.Counter.TypeCode === 3) {
			buySumm = Math.floor(O.Counter.Value);
			if (buySumm >= 100000) {
				cardLevel = 2;
			}
		}
	}
	AO.ShowMessage("На карте накоплено баллов: " + bonusSumm
					+ "\n" + "Сумма покупок по карте: " + buySumm
					+ "\n" + "Уровень карты: " + cardLevel);
}

function FuncAct(AO, RO) {
}

function NoAction(AO, RO, POS) {
}

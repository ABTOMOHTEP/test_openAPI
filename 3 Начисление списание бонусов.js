function BeforeAct(AO, RO, E, O, CO) {
	if(RO.ReceiptType === "ВОЗВРАТ") {
		return 0;
	}
	if (RO.Card.Count === 0) {
		return 0;
	}

	var bonusCardIndex = 0;
	for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
		if (RO.Card.Value.length === 6) {
			bonusCardIndex = RO.Card.Index;
			break;
		}
	}
	if (bonusCardIndex === 0) {
		return 0;
	}

	//**** расчет суммы товаров, запрещенных для начисления бонусов
	var summRestrictWares = 0;
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++){
		if (RO.Pos.Storno === true) {
			continue;
		}
		for (RO.Pos.Classifier.Index = 1; RO.Pos.Classifier.Index <= RO.Pos.Classifier.Count; RO.Pos.Classifier.Index ++) {
			if (RO.Pos.Classifier.Code === "2") {
				summRestrictWares += RO.Pos.SummWD;
			}
		}
	}
	//**** конец расчета суммы запрещенных для начисления товаров

	var standartProc = getProc(RO.SummWD - summRestrictWares);
	var bonusTotal = 0;

	//**** расчет суммы начисленных бонусов для каждой позиции
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
		if (RO.Pos.Storno === true) {
			continue;
		}
		var noExtraBonus = false;
		for (RO.Pos.DiscPos.Index = 1; RO.Pos.DiscPos.Index <= RO.Pos.DiscPos.Count; RO.Pos.DiscPos.Index ++) {
			if ((RO.Pos.DiscPos.DiscRateCode === 27) && (RO.Pos.DiscPos.Summ !== 0)) {
				noExtraBonus = true;
			}
		}

		var noBonus = false;
		var extraBonus50 = false;
		var wareBonus = 0;
		var varName = "bonus" + RO.Pos.Index;
		for (RO.Pos.Classifier.Index = 1; RO.Pos.Classifier.Index <= RO.Pos.Classifier.Count; RO.Pos.Classifier.Index ++) {
			if (RO.Pos.Classifier.Code === "2") {
				noBonus = true;
			}
			else if (RO.Pos.Classifier.Code === "5") {
				extraBonus50 = true;
			}
		}
		if ((noBonus === false) && (standartProc !== 5000)) {
			if ((extraBonus50 === true) && (noExtraBonus === false)) {
				wareBonus = RO.Pos.SummWD * 50 / 100;
			} else {
				wareBonus = RO.Pos.SummWD * standartProc / 100;
			}
			wareBonus = Math.round(wareBonus * 100) / 100;
		} else if ((noBonus === false) && (standartProc === 5000)) {
			wareBonus = RO.Pos.SummWD / (RO.SummWD - summRestrictWares) * 5000;
		}
		RO.UserValues.Set(varName, wareBonus);
		bonusTotal += wareBonus;
	}
	//**** конец расчета суммы начисленных бонусов для каждой позиции

	if (standartProc === 5000) {
		bonusTotal = 5000;
	}

	RO.UserValues.Set("nachislenie", Math.ceil(bonusTotal));
}

function FuncAct(AO, RO, CO)
{
}

function NoAction(AO, RO, POS, CO)
{
}

function AfterAct(AO, RO, E, O)
{
	if (RO.ReceiptType === "ВОЗВРАТ") {
		return 0;
	}

	var bonusCardIndex = 0;
	for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
		if (RO.Card.Value.length === 6) {
			bonusCardIndex = RO.Card.Index;
			break;
		}
	}
	if (bonusCardIndex === 0) {
		return 0;
	}

	//добавление накоплений к счетчику
	var BonusSumm = RO.UserValues.Get("nachislenie");
	// for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
		// AO.ShowMessage("Код счетчика: " + RO.Card.Counter.Code + " код карты: " + RO.Card.Code);
		// if (RO.Card.Counter.TypeCode === "1") {
			RO.Card.Counter.AddValueByTypeCode(1, Math.ceil(BonusSumm));
			// break;
		// }
	// }
	var Mess = "На чек начислено бонусных баллов: " + BonusSumm;

	// списание
	var totalDisc = RO.UserValues.Get("spisanie");
	if (totalDisc > 0) {
		// привязываем к карте классификатор стоп-листа списаний
		RO.Card.Classifier.Bind(1);
		// списание бонусов со счетчика
		RO.Card.Counter.AddValueByTypeCode(1, (Math.ceil(-totalDisc)));
		Mess = Mess + "\nСписано бонусных баллов: " +  (Math.ceil(totalDisc));
	}

	//вывод сообщения о количестве списанных/накопленных баллов
	AO.ShowMessage(Mess);
}

function getProc(SummCheque) {
	//**** расчет стандартного процента для начисления
	var standartProc = 0;
	if (SummCheque>=200001) {
		standartProc = 5000;
	} else if (SummCheque>=100001) {
		standartProc = 1.5;
	} else if (SummCheque>=50001) {
		standartProc = 2;
	} else if (SummCheque>=10001) {
		standartProc = 2.5;
	} else if (SummCheque>=500) {
		standartProc = 3;
	}
	return standartProc;
	//**** конец расчета стандартного процента для начисления
}

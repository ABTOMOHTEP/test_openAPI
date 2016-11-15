function PrintHeader(PO, RO) {
	PO.PrintLRStringLF("=","=","=");
}

function PrintPosition(PO, RO) {
	if (RO.Pos.Storno === 1) {
		PO.PrintCenterString("СТОРНО", " ");
	}
	PO.PrintString(RO.Pos.Number + ". " + RO.Pos.WareText);
	if (RO.Pos.Storno === 0) {
		if ((RO.Pos.AspectStr !== "") && (RO.Pos.Ware.Name === "Пополнение баланса подарочной карты")) {
			for (RO.Pos.Aspect.Index = 1; RO.Pos.Aspect.Index <= RO.Pos.Aspect.Count; RO.Pos.Aspect.Index++) {
				if ((RO.Pos.Aspect.Code !== 0) && (RO.Pos.Aspect.Code !== 1000000000)) {
					PO.PrintStringWordWrap("    Подарочная карта:" + " "+RO.Pos.Aspect.Text);
				}
			}
		}

		PO.PrintLRStringLF("  "	+ RO.Pos.FracSale?PO.FormatQuantity(RO.Pos.Quantity):RO.Pos.Quantity + "*" + PO.FormatCurrency(RO.Pos.Price), PO.FormatCurrency(RO.Pos.SummForD),"_");

		if (RO.Pos.TotalDiscSumm !== 0) {
			if (RO.Pos.TotalDiscSumm < 0) {
				PO.PrintLRStringLF("  " + "+" + PO.FormatPercent(RO.Pos.TotalDiscValue) + "%", PO.FormatCurrency(-RO.Pos.TotalDiscSumm), "_");
			}
			else {
				PO.PrintLRStringLF("  " + "-" + PO.FormatPercent(RO.Pos.TotalDiscValue) + "%", PO.FormatCurrency(RO.Pos.TotalDiscSumm), "_");
			}
			if (RO.Pos.TotalDiscSumm !== 0) {
				PO.PrintLRString("  " + "Сумма", PO.FormatCurrency(RO.Pos.SummWD), "_");
			}
			if (RO.Pos.Number !== RO.Pos.Count) {
				PO.PrintLRStringLF("-", "-", "-");
			}
		}
	}
}

function PrintFooter(PO, RO) {
	PO.PrintLRStringLF("=", "=", "=");
	for(RO.Aspect.Index = 1; RO.Aspect.Index <= RO.Aspect.Count; RO.Aspect.Index++) {
		if (RO.Aspect.Text !== "") {
			PO.PrintStringWordWrap(RO.Aspect.AspectText + ": " + RO.Aspect.Text);
		}
	}

	PO.PrintLRStringLF("Итог",PO.FormatCurrency(RO.SummForD),"_");
	if (RO.SummForD !== RO.SummWD ) {
		PO.PrintLRStringLF("Сумма со скидками",PO.FormatCurrency(RO.SummWD),"_");
	}

	PO.PrintLRStringLF("-", "-", "-");

	for(RO.Tax.Index = 1; RO.Tax.Index <= RO.Tax.Count; RO.Tax.Index++) {
		if (RO.Tax.Summ !== 0) {
			PO.PrintLRString("Включая налоги " + RO.Tax.TaxRateText, PO.FormatCurrency(RO.Tax.Summ), "_");
		}
		PO.PrintLRStringLF("-", "-", "-");
	}

	PO.PrintStringWordWrap("Оплата");
	for(RO.Payment.Index = 1; RO.Payment.Index <= RO.Payment.Count;	RO.Payment.Index++) {
		if(RO.Payment.ClientSumm > 0) {
			PO.PrintLRString("  " + RO.Payment.Text, "=" + PO.FormatCurrency(RO.Payment.ClientSumm), "_");
		}
		else {
			PO.PrintStringWordWrap("Сдача");
			PO.PrintLRString("  " + RO.Payment.Text, "=" + PO.FormatCurrency(-RO.Payment.ClientSumm), "_");
		}
		if(RO.Payment.Card !== "") {
			PO.PrintStringWordWrap("    " + RO.Payment.Card);
		}
	}

	//***********************
	// печать бонусных баллов
	//***********************
	var BonusDelta = 0;
	BonusDelta = RO.UserValues.Get("nachislenie");

	var bonusCardInserted = false;
	for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
		if (RO.Card.Value.length === 6) {
			for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
				if (RO.Card.Counter.TypeCode === 1) {
					PO.PrintLRStringLF("Баланс бонусов без учета этого чека: ", PO.FormatCurrency(RO.Card.Counter.Value), "_");
					bonusCardInserted = true;
				}
			}
		}
	}

	try
	{
		// если карта введена, берем накопления из пользовательской переменной
		if(bonusCardInserted === true) {
			PO.PrintStringWordWrap("На чек начислено бонусных баллов: " + BonusDelta);
		}
		// если карта не введена, дублируем логику расчета начислений
		else {
			//*************** расчет суммы товаров, запрещенных для начисления бонусов
			var summRestrictWares = 0;
			for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
				for (RO.Pos.Classifier.Index = 1; RO.Pos.Classifier.Index <= RO.Pos.Classifier.Count; RO.Pos.Classifier.Index ++) {
					if (RO.Pos.Classifier.Code === 2) {
						summRestrictWares += RO.Pos.SummWD;
					}
				}
			}
			//*************** конец расчета суммы запрещенных для начисления товаров

			var standartProc = getProc(RO.SummWD - summRestrictWares);
			var bonusTotal = 0;
			var noExtraBonus = false;

			//*************** расчет суммы начисленных бонусов для каждой позиции
			for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
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
					if (RO.Pos.Classifier.Code === 2) {
						noBonus = true;
					}
					else if (RO.Pos.Classifier.Code === 5) {
						extraBonus50 = true;
					}
				}
				if ((noBonus === false) && (standartProc !== 5000)) {
					if ((extraBonus50 === true) && (noExtraBonus === false)) {
						wareBonus = RO.Pos.SummWD * 50 / 100;
					}
					else {
						wareBonus = RO.Pos.SummWD * standartProc / 100;
					}
					wareBonus = Math.round(wareBonus * 100) / 100;
				}
				else if ((noBonus === false) && (standartProc === 5000)) {
					wareBonus = RO.Pos.SummWD / (RO.SummWD - summRestrictWares) * 5000;
				}
				RO.UserValues.Set(varName, wareBonus);
				bonusTotal += wareBonus;
				bonusTotal = Math.ceil(bonusTotal);
			}
			//*************** конец расчета суммы начисленных бонусов для каждой позиции

			if (standartProc === 5000) {
				bonusTotal = 5000;
			}

			PO.PrintStringWordWrap("На чек могло быть начислено бонусных баллов: " + bonusTotal);
		}
	}
	catch(e) {
	}

	var totalDisc = 0;
	totalDisc = RO.UserValues.Get("spisanie");
	totalDisc = Math.floor(totalDisc);

	//вывод сообщения о количестве списанных баллов
	if ((bonusCardInserted === true) && (totalDisc !== 0)) {
		PO.PrintStringWordWrap("Списано бонусных баллов: " + totalDisc);
	}

	if(RO.ClientCard !== "")	{
		for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
			if(RO.Card.Value.length === 6) {
				PO.PrintStringWordWrap("Бонусная карта: " + RO.Card.Value);
			}
			else if(RO.Card.Value.length === 8)	{
				PO.PrintStringWordWrap("Подарочная карта: " + RO.Card.Value);
			}
		}
	}
	//****************************
	//конец печати бонусных баллов
	//****************************
}

function getProc(SummCheque) {
	var standartProc = 0;
	if (SummCheque>=200001) {
		standartProc = 5000;
	}
	else if (SummCheque>=100001) {
		standartProc = 1.5;
	}
	else if (SummCheque>=50001) {
		standartProc = 2;
	}
	else if (SummCheque>=10001) {
		standartProc = 2.5;
	}
	else if (SummCheque>=500) {
		standartProc = 3;
	}

	return standartProc;
}

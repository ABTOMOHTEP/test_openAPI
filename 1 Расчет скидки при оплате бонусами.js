function FuncAct(AO, RO, CO) {
	// test git
	var bonusCardIndex = 0;
	//**** проверка на введенную бонусную карту
	for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
		if (RO.Card.Value.length === 6) {
			bonusCardIndex = RO.Card.Index;
			break;
		}
	}
	if (bonusCardIndex === 0) {
		AO.Cancel();
	}
	//**** конец проверки на введенную бонусную карту


	//**** проверка принадлежности карты к стоп-листу списаний
	for (RO.Card.Classifier.Index = 1; RO.Card.Classifier.Index <= RO.Card.Classifier.Count; RO.Card.Classifier.Index ++) {
		if (RO.Card.Classifier.Code === 1) {
			AO.ShowMessage("С данной карты сегодня уже списывались бонусы!");
			AO.Cancel();
		}
	}
	//**** конец проверки принадлежности карты к стоп-листу списаний


	//**** проверка наличия других скидок
	// скидки на документ
	if (RO.Disc.Count > 0) {
		AO.ShowMessage("Запрещено списывать бонусы при наличии другой скидки на документ!");
		AO.Cancel();
	}
	// ручные скидки на товары ставка с кодом "2"
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
		for (RO.Pos.DiscPos.Index = 1; RO.Pos.DiscPos.Index <= RO.Pos.DiscPos.Count; RO.Pos.DiscPos.Index ++) {
			if (RO.Pos.DiscPos.DiscRateCode === 2) {
				AO.ShowMessage("Запрещено списывать бонусы при наличии ручной скидки!");
				AO.Cancel();
			}
		}
	}
	//**** конец проверки наличия других скидок


	//**** расчет накоплений и уровня карты клиента
	RO.Card.Index = bonusCardIndex;
	var summBonusClient = 0;
	var bonusCardLevel = 1;
	for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
		if (RO.Card.Counter.TypeCode === 1) {
			summBonusClient = RO.Card.Counter.Value;
		}
		else if (RO.Card.Counter.TypeCode === 3) {
			buySumm = Math.floor(RO.Card.Counter.Value);
			if (buySumm >= 100000) {
				bonusCardLevel = 2;
			}
		}
	}
	//**** конец расчета накоплений на карте клиента


	//**** расчет максимальной суммы списания для товаров с максимальной скидкой
	var summDiscWares = 0;   // сумма, разрешенная для списания
	var summRealDisc = 0;    // сумма примененных скидок на чек
	var summDokForSkid = 0;  // сумма документа для расчета процента скидки
	var autoDiscActive;
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
		autoDiscActive = false;
		if (RO.Pos.Storno === 0) {
			summRealDisc += RO.Pos.SummForD - RO.Pos.SummWD;
			//продажи по свободной цене
			if (RO.Pos.Ware.Code === "") {
				summDiscWares += RO.Pos.SummForD;
			}
			//обычные продажи
			if (RO.Pos.Ware.MaxDiscount !== 0) {
				summDiscWares += RO.Pos.SummForD * RO.Pos.Ware.MaxDiscount / 100;
			}
			if ((RO.Pos.SummForD - RO.Pos.SummWD) === 0) {
				summDokForSkid += RO.Pos.SummForD;
			} else if ((RO.Pos.SummForD - RO.Pos.SummWD) !== 0) {
				for (RO.Pos.DiscPos.Index = 1; RO.Pos.DiscPos.Index <= RO.Pos.DiscPos.Count; RO.Pos.DiscPos.Index ++) {   // перебираем сработавшие скидки на позицию
					if ((RO.Pos.DiscPos.KindD === 2) && (RO.Pos.DiscPos.TypeD === 0) && (RO.Pos.DiscPos.Summ !== 0)) {  // ищем автоматические отрицательные процентные ненулевые скидки на позицию
						autoDiscActive = true;
					}
				}
				if (autoDiscActive === false) {
					summDokForSkid += RO.Pos.SummForD;
				}
			}
		}
	}
	//**** конецу расчета максимальной суммы списания для товаров с максимальной скидкой


	//**** рассчет суммы товаров с классификатором "товарыСоСкидкой10" и "товарыСоСкидкой20"
	var summWares10 = 0;
	var summWares20 = 0;
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {  //**** цикл по товарам, ищем классификатор с кодом "3" или "4"
		for (RO.Pos.Classifier.Index = 1; RO.Pos.Classifier.Index <= RO.Pos.Classifier.Count; RO.Pos.Classifier.Index ++) {
			if (RO.Pos.Classifier.Code === 3) {
				if ((RO.Pos.SummForD - RO.Pos.SummWD) === 0) {
					summWares10 += RO.Pos.SummForD;
				}
			} else if (RO.Pos.Classifier.Code === 4) {
				if ((RO.Pos.SummForD - RO.Pos.SummWD) === 0) {
					if (bonusCardLevel === 2) {
						summWares20 += RO.Pos.SummForD;
					}
					else {
						summWares10 += RO.Pos.SummForD;
					}
				}
			}
		}
	}
	//**** конец рассчета суммы товаров с классификатором "товарыСоСкидкой10" и "товарыСоСкидкой20"


	//**** расчет максимального процента списания, исходя из суммы документа
	var standartProc = 0;
	if (summDokForSkid >= 100001) {   //максимум - 1%, если сумма чека больше или равна 100001 руб.
		standartProc = 1;
	} else if (summDokForSkid >= 50001) {   //максимум - 2%, если сумма чека больше или равна 50001 руб.
		standartProc = 2;
	} else if (summDokForSkid >= 20001) {   //максимум - 3%, если сумма чека больше или равна 20001 руб.
		standartProc = 3;
	} else if (summDokForSkid >= 5001) {   //максимум - 4%, если сумма чека больше или равна 5001 руб.
		standartProc = 4;
	} else if (summDokForSkid >= 1001) { //максимум - 5%, если сумма чека если сумма чека больше или равна 1001 руб.
		standartProc = 5;
	} else if (summDokForSkid >= 10) { //максимум - 10%, если сумма чека если сумма чека больше или равна 10 руб.
		standartProc = 10;
	}
	//**** конец расчета максимального процента списания, исходя из суммы документа


	//**** расчет максимальной суммы скидки от суммы чека (без учета накоплений клиента)
	var maxBonusDiscForDocument = 0;
	if (summDokForSkid < 10) {
		maxBonusDiscForDocument = 0;
	} else {
		var discSummWares10 = summWares10 / 100 * (10 - standartProc); // сумма доп. скидки на товары с классификатором товарыСоСкидкой10
		var discSummWares20 = summWares20 / 100 * (20 - standartProc); // сумма доп. скидки на товары с классификатором товарыСоСкидкой20
		maxBonusDiscForDocument = Math.min(Math.floor(summDokForSkid / 100 * standartProc + discSummWares10 + discSummWares20), Math.floor(summDiscWares - summRealDisc));
	}
	//**** конец расчета суммы скидки от суммы чека (без учета накоплений клиента)


	//**** расчет суммы скидки от суммы чека (с учетом накоплений клиента)
	var maxBonusDiscForClient = 0;
	RO.Card.Index = bonusCardIndex;
	if (summBonusClient > 0) {
		if (summDokForSkid < 10) {
			maxBonusDiscForClient = 0;
		} else {
			maxBonusDiscForClient = Math.min(Math.floor(summBonusClient), maxBonusDiscForDocument);
		}
	} else {
		maxBonusDiscForClient = 0;
		AO.ShowMessage("Нулевой баланс карты или карта не введена!");
	}
	//**** конец расчета суммы скидки от суммы чека (с учетом накоплений клиента)


	//**** ввод суммы списания
	var stringMessage = "Введите значение скидки (максимум: " + maxBonusDiscForClient + " баллов)";
	var realDisc = AO.InputString(stringMessage, maxBonusDiscForClient, 10);
	if (realDisc === null || realDisc === "" || realDisc > maxBonusDiscForClient || realDisc === 0) {
		AO.ShowMessage("Введено неверное значение!", Icon.Exclamation);
		AO.Cancel();
	}
	RO.UserValues.Set("spisanie", realDisc);
	//**** конец ввода суммы списания


	//*********************************
	// распределение скидок по позициям
	//*********************************
	var koeffWare;
	var autoDiscActiveWare;
	var maxDiscWare;
	var finalSkid;
	var varName;
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
		//**** вычисляем процент для текущего товара
		koeffWare = standartProc;
		autoDiscActiveWare = false;

		if (RO.Pos.Storno === 1) {
			koeffWare = 0;
		} else {
			for (RO.Pos.DiscPos.Index = 1; RO.Pos.DiscPos.Index <= RO.Pos.DiscPos.Count; RO.Pos.DiscPos.Index ++) {   // перебираем сработавшие скидки на позицию
				if ((RO.Pos.DiscPos.KindD === 2) && (RO.Pos.DiscPos.TypeD === 0) && (RO.Pos.DiscPos.Summ !== 0)) {  // ищем автоматические отрицательные процентные ненулевые скидки на позицию
					autoDiscActiveWare = true;
					koeffWare = 0;
				}
			}

			if (autoDiscActiveWare === false) {
				for (RO.Pos.Classifier.Index = 1; RO.Pos.Classifier.Index <= RO.Pos.Classifier.Count; RO.Pos.Classifier.Index ++) {
					if (RO.Pos.Classifier.Code === 3) {  // ищем классификатор с кодом "3" (10 процентов бонусами)
						koeffWare = 10;
					} else if (RO.Pos.Classifier.Code === 4) {  // ищем классификатор с кодом "4" (20 процентов бонусами)
						if (bonusCardLevel === 2) {
							koeffWare = 20;
						} else {
							koeffWare = 10;
						}
					}
				}
			}
		}

		//**** макс возможная скидка для данного товара
		maxDiscWare = RO.Pos.SummForD * koeffWare / 100;

		//**** реальная сумма для списания с данного товара
		finalSkid = Math.round(realDisc * maxDiscWare / maxBonusDiscForDocument * 100) / 100;

		//**** записываем пользовательскую переменную для позиции
		varName = "skidka" + RO.Pos.Index;
		RO.UserValues.Set(varName, finalSkid);
	}
	//*********************************
	// конец распределения скидок по позициям
	//*********************************

	//**** пересчет всех скидок
	RO.RecalcAllDiscounts();
}

function BeforeAct(AO, RO, E) {
	if ((E === 6) && (RO.Payment.PayCode === 101)) {
		var totalSertificatesRemain = 0;
		for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
			if (RO.Card.Value.length === 8) {
				for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
					if (RO.Card.Counter.TypeCode === 2) {
						totalSertificatesRemain += RO.Card.Counter.Value;
					}
				}
				for (RO.Card.Classifier.Index = 1; RO.Card.Classifier.Index <= RO.Card.Classifier.Count; RO.Card.Classifier.Index ++) {
					if (RO.Card.Classifier.Code === "1") {
						AO.ShowMessage("С сертификата " + RO.Card.Value + " уже списывались средства!");
						AO.Cancel();
					}
				}
			}
		}
		if (totalSertificatesRemain === 0) {
			AO.ShowMessage("Сертификаты не введены или полностью погашены!");
			AO.Cancel();
		}

		var skid1 = Math.min(RO.SummWD, totalSertificatesRemain);
		//var stringMessage = "Введите сумму списания (максимум: " + skid1 + " рублей)";
		var realDisc = skid1;//AO.InputString(stringMessage, skid1, 10);
		// if (realDisc === null || realDisc === "" || realDisc > skid1 || realDisc === 0) {
		//	AO.ShowMessage("Введено неверное значение!", Icon.Exclamation);
		//	AO.Cancel();
		// }
		// else{
			// Списываем со всех сертификатов
			var remainingSumm = realDisc;
			for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
				if (RO.Card.Value.length === 8) {
					for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
						if (RO.Card.Counter.TypeCode === 2) {
							var sertificateSumm = RO.Card.Counter.Value;
							var sertificatePaymentSumm = Math.min(sertificateSumm, remainingSumm);
							remainingSumm -= sertificatePaymentSumm;
							RO.Card.Counter.AddValue(-sertificatePaymentSumm);
							RO.Card.Classifier.Bind(1);
							break;
						}
					}
				}
			}
			RO.AddPayment(101, realDisc);
			AO.Cancel();
		//}
	}
	if ((E === 7) && (RO.Payment.PayCode === 101)) {  // при сторнировании оплаты возвращаем сумму платежа на счетчики
		var remainingSummForStorno = RO.Payment.PaySum;
		for (RO.Card.Index = 1; RO.Card.Index <= RO.Card.Count; RO.Card.Index ++) {
			if (RO.Card.Value.length === 8) {
				for (RO.Card.Counter.Index = 1; RO.Card.Counter.Index <= RO.Card.Counter.Count; RO.Card.Counter.Index ++) {
					if (RO.Card.Counter.TypeCode === 2) {
						RO.Card.Counter.AddValue(remainingSummForStorno);
						remainingSummForStorno = 0;
						for (RO.Card.Classifier.Index = 1; RO.Card.Classifier.Index <= RO.Card.Classifier.Count; RO.Card.Classifier.Index ++) {
							RO.Card.Classifier.UnBind();
						}
						break;
					}
				}
			}
		}
	}
}

function AfterAct(AO, RO, E) {
}

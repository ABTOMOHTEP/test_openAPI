function BeforeAct(AO, RO, E, O, CO) {
	// проверка на вид документа "продажа", на наличие других платежей и на наличие карты в чеке
	if ((RO.ReceiptTypeCode === 1) && (RO.Payment.Count === 0) && (RO.ClientCard === "")) {
		if (AO.ShowMessage("Ввести бонусную/подарочную карту в чек?", Button.YesNo + Icon.Question) === DialogResult.Yes) {
			var WShell = new ActiveXObject("WScript.Shell");
			WShell.SendKeys ("^({F8})");
			AO.Cancel;
		}
	}
}

function AfterAct(AO, RO, E, O, CO){
}

function FuncAct(AO, RO, CO) {
}

function NoAction(AO, RO, POS, CO, UserParam) {
}

function BeforeAct(AO, RO, E, O, CO) {
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {
		for (RO.Pos.DiscPos.Index = 1; RO.Pos.DiscPos.Index <= RO.Pos.DiscPos.Count; RO.Pos.DiscPos.Index ++) {
			if ((RO.Pos.DiscPos.DiscRateCode === 27) && (RO.Pos.DiscPos.Summ > 0)) {
				AO.ShowMessage("Запрещено изменять позиции \n в чеке со списанием бонусами!");
				AO.Cancel();
			}
		}
	}
}

function AfterAct(AO, RO, E, O, CO) {
}

function FuncAct(AO, RO, CO) {
}

function NoAction(AO, RO, POS, CO, UserParam) {
}

function BonusSkidWare(AO, RO, POS, CO, O) {
	var finalSkid = 0;
	for (RO.Pos.Index = 1; RO.Pos.Index <= RO.Pos.Count; RO.Pos.Index ++) {   // поиск текущего товара в списке позиций чека
		if ((RO.Pos.Ware.Code === POS.Ware.Code) && (RO.Pos.Quantity === POS.Quantity) && (RO.Pos.AspectStr === POS.AspectStr)) { // поиск по коду, количеству и значениям разрезов
			var varName = "skidka" + RO.Pos.Index;
			finalSkid =  RO.UserValues.Get(varName);
			break;
		}
	}
	return finalSkid;
}

import { saleState } from "../utilities/allFiles"
import { stateSales } from "../utilities/typeHeaders"

const saleObj = await stateSales(saleState)

export default saleObj

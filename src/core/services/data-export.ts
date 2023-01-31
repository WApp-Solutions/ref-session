import * as ExcelJS from 'exceljs'
import { ISessionAttendee } from '../models/session'
import { ExcelData, ExcelSessionAttendee } from '../models/worksheet'

const transformData = (
    dataToTransform: ISessionAttendee[] | undefined
): ExcelData => {
    const excelData: ExcelData = { columns: [], rows: [] }
    if (dataToTransform !== undefined) {
        dataToTransform.forEach((data, index) => {
            // just do it once
            if (index === 0) {
                for (const k in ExcelSessionAttendee) {
                    excelData.columns.push({ key: k } as ExcelJS.Column)
                }
            }
        })
    }

    return {} as ExcelData
}

export const useExcelExport = (
    worksheetName: string,
    dataToExport: ISessionAttendee[] | undefined
) => {
    // create initial Workbook
    const workbook = new ExcelJS.Workbook()

    // add a Worksheet with given name
    const worksheet = workbook.addWorksheet(worksheetName)

    worksheet.columns = []

    const data = transformData(dataToExport)

    const exportExcel = () => {}

    return { workbook, exportExcel }
}

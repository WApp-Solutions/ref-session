import * as ExcelJS from 'exceljs'
import { ISessionAttendee } from './session'

export const ExcelSessionAttendee = {
    lastName: 'lastName',
    firstName: 'firstName'
} as const

export type ExcelSessionAttendee = [keyof typeof ExcelSessionAttendee];

export interface ExcelData {
    columns: ExcelJS.Column[]
    rows: ExcelJS.Row[]
}

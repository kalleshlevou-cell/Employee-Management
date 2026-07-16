import { Readable } from 'stream';
import csvParser from 'csv-parser';

export interface CSVEmployeeRow {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate?: string;
  status?: string;
  role?: string;
  reportingManagerId?: string; // We can match by employeeId of the manager
}

export const parseCSVBuffer = (buffer: Buffer): Promise<CSVEmployeeRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CSVEmployeeRow[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csvParser())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

import { AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  families: [
    { id: 'F1', name: 'Colas básicas', type: 'Volumen', margin: 10 },
    { id: 'F2', name: 'Enfoscados', type: 'Volumen', margin: 12 },
    { id: 'F3', name: 'Monocapas', type: 'Volumen', margin: 14 },
    { id: 'F4', name: 'Juntas', type: 'Técnico', margin: 28 },
    { id: 'F5', name: 'Impermeabilización', type: 'Técnico', margin: 32 },
    { id: 'F6', name: 'Autonivelantes', type: 'Técnico', margin: 29 },
    { id: 'F7', name: 'Reparación', type: 'Técnico', margin: 30 },
    { id: 'F8', name: 'Adhesivos técnicos', type: 'Sistema', margin: 22 },
    { id: 'F9', name: 'SATE', type: 'Técnico', margin: 26 },
    { id: 'F10', name: 'Acabados técnicos', type: 'Técnico', margin: 27 },
  ],
  segments: [
    {
      id: 'generalista',
      name: 'Generalista',
      F1: 28, F2: 22, F3: 10, F4: 7, F5: 9, F6: 6, F7: 5, F8: 6, F9: 4, F10: 3,
      benchmarkMargin: 18.5,
    },
    {
      id: 'especialista-rehabilitacion',
      name: 'Especialista Rehabilitación',
      F1: 15, F2: 12, F3: 8, F4: 12, F5: 15, F6: 10, F7: 10, F8: 8, F9: 6, F10: 4,
      benchmarkMargin: 22.1,
    },
    {
      id: 'obra-nueva',
      name: 'Obra Nueva',
      F1: 35, F2: 28, F3: 15, F4: 5, F5: 5, F6: 4, F7: 2, F8: 4, F9: 1, F10: 1,
      benchmarkMargin: 14.2,
    },
  ],
};

export const SAMPLE_CSV = `cliente,ciudad,region,comercial,segmento,F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,volumen
García Distribuciones,Sevilla,Sur,Pepe García,Generalista,45,30,10,3,2,2,2,3,2,1,2000
Materiales Roca,Madrid,Centro,Ana Martínez,Generalista,35,25,15,5,5,3,3,4,3,2,1500
Construmat Norte,Bilbao,Norte,Luis Rodríguez,Generalista,28,20,12,8,9,6,5,6,4,2,1100
Reformas del Norte,Bilbao,Norte,Luis Rodríguez,Especialista Rehabilitación,20,15,8,10,12,8,10,8,6,3,800
Distribuciones Pérez,Valencia,Levante,Ana Martínez,Generalista,40,28,8,4,3,4,3,4,4,2,1200
Morteros Levante,Alicante,Levante,Ana Martínez,Generalista,32,22,12,7,8,5,5,5,2,2,950
Construcciones Mas,Barcelona,Este,Pepe García,Especialista Rehabilitación,25,18,10,9,11,7,8,6,4,2,700
Suministros Gil,Zaragoza,Norte,Luis Rodríguez,Obra Nueva,50,25,8,2,2,3,2,4,2,2,600`;

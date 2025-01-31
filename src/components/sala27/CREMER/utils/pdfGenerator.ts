import { jsPDF } from 'jspdf';
import { Orden } from '../types';
import { formatTime } from './formatters';

export const generatePDF = (orden: Orden) => {
    const doc = new jsPDF();

    // Document header
    doc.setFontSize(16);
    doc.text(`Reporte de Orden: ${orden.nombre}`, 20, 20);

    // General information
    doc.setFontSize(12);
    doc.text(`Descripción: ${orden.descripcion}`, 20, 40);
    doc.text(`Inicio: ${new Date(orden.horaInicio).toLocaleString()}`, 20, 50);
    if (orden.horaFin) {
        doc.text(`Fin: ${new Date(orden.horaFin).toLocaleString()}`, 20, 60);
    } else {
        doc.text('Estado: En progreso', 20, 60);
    }

    // Statistics section
    doc.text('Estadísticas:', 20, 80);
    doc.text(`Tiempo Total: ${formatTime(orden.tiempoTotal)}`, 30, 90);
    doc.text(`Tiempo en Pausas: ${formatTime(orden.tiempoTotalPausas)}`, 30, 100);
    doc.text(`Tiempo Efectivo: ${formatTime(orden.tiempoTotal - orden.tiempoTotalPausas)}`, 30, 110);
    doc.text(`Número de Pausas: ${orden.pausas.length}`, 30, 120);

    // Detailed pause records
    doc.text('Registro de Pausas:', 20, 140);
    orden.pausas.forEach((pausa, index) => {
        const y = 150 + (index * 25);
        doc.text(`${index + 1}. ${pausa.motivo}`, 30, y);
        doc.text(`   Inicio: ${new Date(pausa.inicio).toLocaleString()}`, 35, y + 5);
        if (pausa.fin) {
            doc.text(`   Fin: ${new Date(pausa.fin).toLocaleString()}`, 35, y + 10);
            doc.text(`   Duración: ${formatTime(pausa.tiempo || 0)}`, 35, y + 15);
        } else {
            doc.text('   En curso', 35, y + 10);
        }
    });

    doc.save(`orden_${orden.id}_${new Date().toISOString()}.pdf`);
};
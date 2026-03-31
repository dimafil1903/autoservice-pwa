import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { db } from '@/lib/supabase'
import type { Client, Car, Order, OrderItem } from '@/lib/types'

export async function generateActPdf(orderId: string): Promise<Blob> {
  const [orders, items] = await Promise.all([
    db.getOrders() as Promise<Order[]>,
    db.getOrderItems(orderId) as Promise<OrderItem[]>,
  ])
  const order = orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Замовлення не знайдено')

  let car: Car | null = null
  let client: Client | null = null
  const clients: Client[] = await db.getClients()
  for (const c of clients) {
    const cars: Car[] = await db.getCars(c.id)
    const found = cars.find((cr) => cr.id === order.car_id)
    if (found) { car = found; client = c; break }
  }

  const fopName = localStorage.getItem('fopName') || '___________________'
  const fopIpn = localStorage.getItem('fopIpn') || '___________________'
  const fopAddress = localStorage.getItem('fopAddress') || '___________________'
  const fopPhone = localStorage.getItem('fopPhone') || '___________________'
  const fopCity = localStorage.getItem('fopCity') || '___________________'

  const worksTotal = items.filter(i => i.type === 'work').reduce((s, i) => s + (parseFloat(String(i.total)) || 0), 0)
  const partsTotal = items.filter(i => i.type === 'part').reduce((s, i) => s + (parseFloat(String(i.total)) || 0), 0)
  const total = worksTotal + partsTotal
  const actNum = orderId.slice(-6).toUpperCase()
  const today = new Date().toLocaleDateString('uk-UA')
  const blank = '___________________'

  // Create PDF (A4)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = 15

  function addText(text: string, x: number, yPos: number, options: { fontSize?: number; fontStyle?: string; align?: 'left' | 'center' | 'right'; maxWidth?: number } = {}) {
    doc.setFontSize(options.fontSize || 10)
    doc.setFont('helvetica', options.fontStyle || 'normal')
    if (options.align === 'center') {
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    } else if (options.align === 'right') {
      doc.text(text, pageWidth - margin, yPos, { align: 'right' })
    } else {
      doc.text(text, x, yPos, { maxWidth: options.maxWidth || contentWidth })
    }
  }

  function addLine(yPos: number) {
    doc.setDrawColor(100)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageWidth - margin, yPos)
  }

  function addRow(label: string, value: string, yPos: number): number {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 50, yPos)
    return yPos + 5
  }

  // Header
  addText('Примірник № ___', margin, y, { fontSize: 8, align: 'center' })
  y += 7
  addText(`АКТ № ${actNum}`, margin, y, { fontSize: 14, fontStyle: 'bold', align: 'center' })
  y += 6
  addText('ПРИЙОМУ-ПЕРЕДАЧІ ВИКОНАНИХ РОБІТ', margin, y, { fontSize: 11, fontStyle: 'bold', align: 'center' })
  y += 5
  addText('по ремонту автомобіля', margin, y, { fontSize: 9, align: 'center' })
  y += 7

  // City + Date
  doc.setFontSize(9)
  doc.text(`м. ${fopCity}`, margin, y)
  doc.text(today, pageWidth - margin, y, { align: 'right' })
  y += 3
  addLine(y)
  y += 5

  // Contractor
  addText('ВИКОНАВЕЦЬ:', margin, y, { fontSize: 10, fontStyle: 'bold' })
  y += 5
  y = addRow('ФОП:', fopName, y)
  y = addRow('ІПН:', fopIpn, y)
  y = addRow('Адреса:', fopAddress, y)
  y = addRow('Тел.:', fopPhone, y)
  y += 1
  addLine(y)
  y += 5

  // Customer
  addText('ЗАМОВНИК:', margin, y, { fontSize: 10, fontStyle: 'bold' })
  y += 5
  y = addRow('ПІБ:', client?.name || blank, y)
  y = addRow('Тел.:', client?.phone || blank, y)
  y += 1
  addLine(y)
  y += 5

  // Vehicle
  addText('ВІДОМОСТІ ПРО АВТОМОБІЛЬ:', margin, y, { fontSize: 10, fontStyle: 'bold' })
  y += 5
  y = addRow('Марка, модель:', car ? `${car.brand} ${car.model}` : blank, y)
  y = addRow('Рік випуску:', car?.year ? String(car.year) : '___', y)
  y = addRow('Колір кузова:', car?.color || blank, y)
  y = addRow('Держ. номер:', car?.plate || blank, y)
  y = addRow('VIN-код:', car?.vin || blank, y)
  y = addRow('Пробіг (прийом):', `${order.mileage || '___'} км`, y)
  y = addRow('Пробіг (видача):', `${order.mileage_out || '___'} км`, y)
  y = addRow('Дата прийому:', order.date_in || blank, y)
  y = addRow('Дата видачі:', order.date_out || today, y)
  y += 1
  addLine(y)
  y += 5

  // Items table
  addText('ПЕРЕЛІК ВИКОНАНИХ РОБІТ ТА ВИКОРИСТАНИХ МАТЕРІАЛІВ:', margin, y, { fontSize: 10, fontStyle: 'bold' })
  y += 3

  const tableData = items.map((item, i) => [
    String(i + 1),
    item.name,
    item.unit || 'шт',
    String(item.qty),
    parseFloat(String(item.price)).toFixed(2),
    parseFloat(String(item.total)).toFixed(2),
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['№', 'Найменування', 'Од.', 'К-ть', 'Ціна, грн', 'Сума, грн']],
    body: tableData,
    foot: [
      ['', '', '', '', { content: 'Вартість робіт:', styles: { halign: 'right', fontStyle: 'bold' } }, worksTotal.toFixed(2)],
      ['', '', '', '', { content: 'Вартість матеріалів:', styles: { halign: 'right', fontStyle: 'bold' } }, partsTotal.toFixed(2)],
      ['', '', '', '', { content: 'РАЗОМ:', styles: { halign: 'right', fontStyle: 'bold', fontSize: 10 } }, { content: total.toFixed(2), styles: { fontStyle: 'bold', fontSize: 10 } }],
    ],
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 5

  // Check page break
  if (y > 250) {
    doc.addPage()
    y = 15
  }

  addText('Сума прописом: ______________________________________________________________________ грн.', margin, y, { fontSize: 9 })
  y += 5
  addLine(y)
  y += 5

  // Warranty
  addText('ГАРАНТІЙНІ ЗОБОВ\'ЯЗАННЯ:', margin, y, { fontSize: 10, fontStyle: 'bold' })
  y += 5
  addText('На виконані роботи: _______ місяців. На встановлені запчастини: _______ місяців.', margin, y, { fontSize: 9 })
  y += 4
  doc.setFontSize(7)
  doc.setTextColor(100)
  doc.text('Гарантія не поширюється на дефекти, що виникли внаслідок неналежної експлуатації або зовнішніх механічних пошкоджень.', margin, y, { maxWidth: contentWidth })
  doc.setTextColor(0)
  y += 5
  addLine(y)
  y += 5

  // Completion text
  doc.setFontSize(8)
  doc.text('Роботи виконано в повному обсязі та належній якості. Замовник ознайомлений з гарантійними умовами обслуговування. Претензій до якості та обсягу виконаних робіт не має.', margin, y, { maxWidth: contentWidth })
  y += 10
  addLine(y)
  y += 8

  // Signatures
  const sigWidth = contentWidth / 2 - 5
  const leftX = margin
  const rightX = margin + sigWidth + 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ВИКОНАВЕЦЬ:', leftX, y)
  doc.text('ЗАМОВНИК:', rightX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Майстер-приймальник:', leftX, y)
  y += 15
  doc.line(leftX, y, leftX + sigWidth, y)
  doc.line(rightX, y, rightX + sigWidth, y)
  y += 4
  doc.setFontSize(7)
  doc.text('підпис                              ПІБ', leftX, y)
  doc.text('підпис                              ПІБ', rightX, y)
  y += 5
  addLine(y)
  y += 4
  addText('Акт складено у 2 (двох) примірниках: примірник 1 — виконавцю, примірник 2 — замовнику', margin, y, { fontSize: 7, align: 'center' })

  return doc.output('blob')
}

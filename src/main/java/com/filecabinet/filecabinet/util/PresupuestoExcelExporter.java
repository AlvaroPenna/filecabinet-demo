package com.filecabinet.filecabinet.util;

import com.filecabinet.filecabinet.entidades.DetalleDocumento;
import com.filecabinet.filecabinet.entidades.Presupuesto;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.util.IOUtils;
import org.apache.poi.xssf.usermodel.*;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;

public class PresupuestoExcelExporter {

    private XSSFWorkbook workbook;
    private XSSFSheet sheet;
    private Presupuesto presupuesto;

    // Color corporativo
    private static final XSSFColor COLOR_AZUL_RAP = new XSSFColor(new java.awt.Color(26, 68, 126),
            new DefaultIndexedColorMap());

    // Estilos
    private XSSFCellStyle styleHeaderTabla;
    private XSSFCellStyle styleDatos;
    private XSSFCellStyle styleBold;
    private XSSFCellStyle styleTotalLabel;
    private XSSFCellStyle styleTotalGrande;
    private XSSFCellStyle styleBoldBig;
    private XSSFCellStyle styleDatosCenter;
    private XSSFCellStyle styleCurrencyCenter;

    private XSSFFont fontBold;
    private XSSFFont fontBig;
    private XSSFFont fontNormal;

    public PresupuestoExcelExporter(Presupuesto presupuesto) {
        this.presupuesto = presupuesto;
        workbook = new XSSFWorkbook();
    }

    private void initStyles() {
        fontBold = workbook.createFont();
        fontBold.setBold(true);
        fontBold.setFontHeightInPoints((short) 11);

        fontBig = workbook.createFont();
        fontBig.setBold(true);
        fontBig.setFontHeightInPoints((short) 13);

        fontNormal = workbook.createFont();
        fontNormal.setFontHeightInPoints((short) 11);

        styleBoldBig = workbook.createCellStyle();
        styleBoldBig.setFont(fontBig);
        styleBoldBig.setVerticalAlignment(VerticalAlignment.TOP);
        styleBoldBig.setAlignment(HorizontalAlignment.LEFT);
        styleBoldBig.setWrapText(true);

        styleBold = workbook.createCellStyle();
        styleBold.setFont(fontBold);
        styleBold.setVerticalAlignment(VerticalAlignment.TOP);
        styleBold.setAlignment(HorizontalAlignment.LEFT);
        styleBold.setWrapText(true);

        styleTotalLabel = workbook.createCellStyle();
        styleTotalLabel.setFont(fontBold);
        styleTotalLabel.setVerticalAlignment(VerticalAlignment.TOP);
        styleTotalLabel.setAlignment(HorizontalAlignment.LEFT);
        styleTotalLabel.setWrapText(false);

        styleDatos = workbook.createCellStyle();
        styleDatos.setFont(fontNormal);
        styleDatos.setVerticalAlignment(VerticalAlignment.TOP);
        styleDatos.setAlignment(HorizontalAlignment.LEFT);
        styleDatos.setWrapText(true);

        styleCurrencyCenter = workbook.createCellStyle();
        styleCurrencyCenter.setFont(fontNormal);
        styleCurrencyCenter.setVerticalAlignment(VerticalAlignment.TOP);
        styleCurrencyCenter.setAlignment(HorizontalAlignment.CENTER);
        DataFormat format = workbook.createDataFormat();
        styleCurrencyCenter.setDataFormat(format.getFormat("#,##0.00 \"€\""));

        styleHeaderTabla = workbook.createCellStyle();
        XSSFFont fontHeader = workbook.createFont();
        fontHeader.setBold(true);
        fontHeader.setFontHeightInPoints((short) 12);
        fontHeader.setColor(IndexedColors.WHITE.getIndex());
        styleHeaderTabla.setFont(fontHeader);
        styleHeaderTabla.setFillForegroundColor(COLOR_AZUL_RAP);
        styleHeaderTabla.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        styleHeaderTabla.setAlignment(HorizontalAlignment.CENTER);
        styleHeaderTabla.setVerticalAlignment(VerticalAlignment.CENTER);

        XSSFFont fontTotal = workbook.createFont();
        fontTotal.setBold(true);
        fontTotal.setFontHeightInPoints((short) 14);
        fontTotal.setColor(COLOR_AZUL_RAP);

        styleTotalGrande = workbook.createCellStyle();
        styleTotalGrande.setFont(fontTotal);
        styleTotalGrande.setDataFormat(format.getFormat("#,##0.00 \"€\""));
        styleTotalGrande.setAlignment(HorizontalAlignment.RIGHT);

        styleDatosCenter = workbook.createCellStyle();
        styleDatosCenter.setFont(fontNormal);
        styleDatosCenter.setVerticalAlignment(VerticalAlignment.TOP);
        styleDatosCenter.setAlignment(HorizontalAlignment.CENTER);
        styleDatosCenter.setWrapText(true);

    }

    private void insertLogo() {
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("static/imagenes/logo.png");
            if (is == null)
                is = getClass().getClassLoader().getResourceAsStream("static/imagenes/logo.png");
            if (is == null)
                is = getClass().getClassLoader().getResourceAsStream("logo.png");

            if (is != null) {
                byte[] bytes = IOUtils.toByteArray(is);
                int pictureIdx = workbook.addPicture(bytes, Workbook.PICTURE_TYPE_PNG);
                is.close();

                Drawing<?> drawing = sheet.createDrawingPatriarch();
                XSSFClientAnchor anchor = workbook.getCreationHelper().createClientAnchor();
                anchor.setCol1(0); // Columna 0 (A)
                anchor.setRow1(0); // Fila 0
                anchor.setDx1(0); // Pegado al borde exacto
                anchor.setDy1(0);

                Picture pict = drawing.createPicture(anchor, pictureIdx);
                pict.resize();
                pict.resize(0.30);

            }
        } catch (Exception e) {
            System.err.println("Excepción al cargar logo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void writeHeaderLine() {
        sheet = workbook.createSheet("Presupuesto");
        initStyles();

        PrintSetup printSetup = sheet.getPrintSetup();
        printSetup.setPaperSize(PrintSetup.A4_PAPERSIZE);

        sheet.setAutobreaks(true); // Permite saltos de página automáticos
        printSetup.setFitWidth((short) 1); // Ajustar ancho a 1 página
        printSetup.setFitHeight((short) 0);

        sheet.setMargin(Sheet.RightMargin, 0.4);
        sheet.setMargin(Sheet.LeftMargin, 0.4);

        // --- COLUMNAS REAJUSTADAS ---
        // Ampliamos la columna 2 para que "BASE IMPONIBLE" quepa sobrada
        sheet.setColumnWidth(0, 12000); // Descripción
        sheet.setColumnWidth(1, 3000); // Cantidad
        sheet.setColumnWidth(2, 4500); // Precio / Etiquetas (Ampliado)
        sheet.setColumnWidth(3, 4500); // Total

        sheet.addMergedRegion(new CellRangeAddress(0, 7, 0, 0));

        insertLogo();

        Row row1 = getOrCreateRow(1);
        createCell(row1, 2, presupuesto.getUsuario().getNombre() + presupuesto.getUsuario().getApellidos(), styleBoldBig);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 2, 3));

        Row row2 = getOrCreateRow(2);
        createCell(row2, 2, "CIF: " + presupuesto.getUsuario().getCif(), styleDatos);
        sheet.addMergedRegion(new CellRangeAddress(2, 2, 2, 3));

        Row row3 = getOrCreateRow(3);
        createCell(row3, 2, "Tel: " + presupuesto.getUsuario().getTelefono(), styleDatos);
        sheet.addMergedRegion(new CellRangeAddress(3, 3, 2, 3));

        Row row4 = getOrCreateRow(4);
        createCell(row4, 2, presupuesto.getUsuario().getEmail(), styleDatos);
        sheet.addMergedRegion(new CellRangeAddress(4, 4, 2, 3));

        Row row5 = getOrCreateRow(5);
        createCell(row5, 2, presupuesto.getUsuario().getDomicilio(), styleDatos);
        sheet.addMergedRegion(new CellRangeAddress(5, 5, 2, 3));

        Row row6 = getOrCreateRow(6);
        createCell(row6, 2, presupuesto.getUsuario().getCodigoPostal() + "-" + presupuesto.getUsuario().getPoblacion()
         + " (" + presupuesto.getUsuario().getProvincia() + ")", styleDatos);
        sheet.addMergedRegion(new CellRangeAddress(6, 6, 2, 3));

        Row row8 = getOrCreateRow(8);
        createCell(row8, 0, "CLIENTE:", styleBold);
        
        Row row9 = getOrCreateRow(9);
        createCell(row9, 0, presupuesto.getCliente().getNombre() + " " + presupuesto.getCliente().getApellidos(), styleDatos);

        Row row10 = getOrCreateRow(10);
        createCell(row10, 0, "CIF: " + presupuesto.getCliente().getCif(), styleDatos);
        createCell(row10, 2, "PRESUPUESTO Nº: " + presupuesto.getNumPresupuesto(), styleBoldBig);
        sheet.addMergedRegion(new CellRangeAddress(10, 10, 2, 3));

        String fechaTexto = "---";
        if (presupuesto.getFechaEmision() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            fechaTexto = sdf.format(presupuesto.getFechaEmision());
        }

        Row row11 = getOrCreateRow(11);
        createCell(row11, 0, "TEL: " + presupuesto.getCliente().getTelefono(), styleDatos);
        createCell(row11, 2, "FECHA: " + fechaTexto, styleBoldBig);
        sheet.addMergedRegion(new CellRangeAddress(11, 11, 2, 3));

        Row row12 = getOrCreateRow(12);
        createCell(row12, 0, presupuesto.getCliente().getDireccion(), styleDatos);

        Row row13 = getOrCreateRow(13);
        createCell(row13, 0, presupuesto.getCliente().getCodigoPostal() + "-" + presupuesto.getCliente().getCiudad(), styleDatos);
    }

    private Row getOrCreateRow(int index) {
        Row row = sheet.getRow(index);
        if (row == null) {
            row = sheet.createRow(index);
        }
        return row;
    }

    private void writeTableHeaders() {
        int headerRowIdx = 16;
        Row row = getOrCreateRow(headerRowIdx);
        row.setHeightInPoints(25);

        createCell(row, 0, "CONCEPTO / DESCRIPCIÓN", styleHeaderTabla);
        createCell(row, 1, "CANT.", styleHeaderTabla);
        createCell(row, 2, "PRECIO U.", styleHeaderTabla);
        createCell(row, 3, "TOTAL", styleHeaderTabla);
    }

    private void writeDataLines() {
        int rowCount = 17;

        if (presupuesto.getDetalles() != null && !presupuesto.getDetalles().isEmpty()) {
            for (DetalleDocumento detalle : presupuesto.getDetalles()) {
                Row row = sheet.createRow(rowCount++);
                int columnCount = 0;

                // --- COLUMNA 0: TRABAJO + DESCRIPCIÓN ---
                Cell cellDesc = row.createCell(columnCount++);

                String trabajo = (detalle.getTrabajo() != null ? detalle.getTrabajo() : "");
                String descripcion = (detalle.getDescripcion() != null ? detalle.getDescripcion() : "");

                String textoCompleto = trabajo;
                if (!descripcion.isEmpty()) {
                    textoCompleto += "\n" + descripcion;
                }

                XSSFRichTextString richString = new XSSFRichTextString(textoCompleto);
                if (trabajo.length() > 0) {
                    richString.applyFont(0, trabajo.length(), fontBold);
                }
                if (descripcion.length() > 0) {
                    int startIndex = trabajo.length();
                    if (textoCompleto.contains("\n"))
                        startIndex++;
                    if (startIndex < textoCompleto.length()) {
                        richString.applyFont(startIndex, textoCompleto.length(), fontNormal);
                    }
                }
                cellDesc.setCellValue(richString);
                cellDesc.setCellStyle(styleDatos);

                double cantidad = (detalle.getCantidad() != null) ? detalle.getCantidad() : 0.0;
                double precio = (detalle.getPrecioUnitario() != null) ? detalle.getPrecioUnitario().doubleValue() : 0.0;
                double subtotal = (detalle.getSubTotal() != null) ? detalle.getSubTotal().doubleValue() : 0.0;

                createCell(row, columnCount++, cantidad, styleDatosCenter);
                createCell(row, columnCount++, precio, styleCurrencyCenter);
                createCell(row, columnCount++, subtotal, styleCurrencyCenter);
            }

        } else {
            Row row = sheet.createRow(rowCount++);
            createCell(row, 0, "Sin conceptos", styleDatos);
        }

        // --- PIE DE PÁGINA ---
        int filaMinimaPie = 39;

        if (rowCount < filaMinimaPie) {
            // ESCENARIO A: Pocos productos (ej: terminamos en fila 20).
            // Saltamos directamente a la fila 42 para que el pie quede abajo estéticamente.
            rowCount = filaMinimaPie;
        } else {
            // ESCENARIO B: Muchos productos (ej: terminamos en fila 50).
            // NO volvemos a la 42 (porque sobrescribiríamos datos).
            // Simplemente dejamos un par de líneas de separación y escribimos a continuación.
            // Excel creará la página 2 automáticamente gracias al printSetup.setFitHeight(0).
            rowCount += 2; 
        }

        // Base Imponible
        Row rowPago = sheet.createRow(rowCount);
        createCell(rowPago, 2, "BASE IMPONIBLE:", styleTotalLabel);
        createCell(rowPago, 3, getSafeDouble(presupuesto.getTotal_bruto()), styleCurrencyCenter);

        // IVA
        Row rowIva = getOrCreateRow(rowCount + 1);
        createCell(rowIva, 2, "I.V.A. " + presupuesto.getTipo_iva() + "%:", styleTotalLabel);
        createCell(rowIva, 3, getSafeDouble(presupuesto.getTotal_iva()), styleCurrencyCenter);

        // Total Final
        Row rowTotal = getOrCreateRow(rowCount + 2);
        Cell cellTituloTotal = rowTotal.createCell(2);
        cellTituloTotal.setCellValue("TOTAL NETO:");

        XSSFCellStyle styleTituloTotal = workbook.createCellStyle();
        XSSFFont fontTitulo = workbook.createFont();
        fontTitulo.setBold(true);
        fontTitulo.setFontHeightInPoints((short) 14);
        fontTitulo.setColor(COLOR_AZUL_RAP);
        styleTituloTotal.setFont(fontTitulo);
        styleTituloTotal.setAlignment(HorizontalAlignment.RIGHT);
        cellTituloTotal.setCellStyle(styleTituloTotal);

        createCell(rowTotal, 3, getSafeDouble(presupuesto.getTotal_neto()), styleTotalGrande);
    }

    private void createCell(Row row, int columnCount, Object value, CellStyle style) {
        Cell cell = row.createCell(columnCount);
        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Long) {
            cell.setCellValue((Long) value);
        } else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Double) {
            cell.setCellValue((Double) value);
        } else {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }

    private double getSafeDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.00;
    }

    public void export(HttpServletResponse response) throws IOException {
        writeHeaderLine();
        writeTableHeaders();
        writeDataLines();

        ServletOutputStream outputStream = response.getOutputStream();
        workbook.write(outputStream);
        workbook.close();
        outputStream.close();
    }
}
package com.final_project.versioncontrolservice.service;

import com.final_project.versioncontrolservice.exception.BadRequestException;
import com.final_project.versioncontrolservice.model.DerivedDocumentIndex;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.IBodyElement;
import org.apache.poi.xwpf.usermodel.IRunElement;
import org.apache.poi.xwpf.usermodel.XWPFAbstractFootnoteEndnote;
import org.apache.poi.xwpf.usermodel.XWPFComment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFFooter;
import org.apache.poi.xwpf.usermodel.XWPFHeader;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFSDT;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.xmlbeans.XmlObject;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.xml.parsers.DocumentBuilderFactory;

@Service
public class DocumentExtractionService {

    public static final int EXTRACTION_VERSION = 3;

    private static final Pattern BLANK_BLOCK = Pattern.compile("(\\r?\\n){2,}");

    public boolean supports(String filePath) {
        String lower = normalizedExtension(filePath);
        return "docx".equals(lower) || "pdf".equals(lower);
    }

    public boolean supportsEditableMerge(String filePath) {
        return "docx".equals(normalizedExtension(filePath));
    }

    public String detectFileType(String filePath) {
        String ext = normalizedExtension(filePath);
        if ("docx".equals(ext) || "pdf".equals(ext)) {
            return ext;
        }
        return "binary";
    }

    public boolean isBinary(String filePath, byte[] bytes) {
        if (supports(filePath)) {
            return true;
        }
        if (bytes == null || bytes.length == 0) {
            return false;
        }
        for (byte value : bytes) {
            int c = value & 0xff;
            if (c == 0) {
                return true;
            }
            if (c < 32 && c != '\n' && c != '\r' && c != '\t') {
                return true;
            }
        }
        return false;
    }

    public ExtractionResult extract(String fileName, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new BadRequestException("Document bytes are empty");
        }

        String type = detectFileType(fileName);
        List<DerivedDocumentIndex.DocumentSegment> segments = switch (type) {
            case "docx" -> extractDocx(bytes);
            case "pdf" -> extractPdf(bytes);
            default -> throw new BadRequestException("Unsupported document type: " + fileName);
        };

        return ExtractionResult.builder()
                .fileType(type)
                .segments(segments)
                .build();
    }

    public String extractPlainText(String fileName, byte[] bytes) {
        ExtractionResult extraction = extract(fileName, bytes);
        List<DerivedDocumentIndex.DocumentSegment> segments =
                extraction.getSegments() == null ? List.of() : extraction.getSegments();
        return segments.stream()
                .map(DerivedDocumentIndex.DocumentSegment::getText)
                .filter(text -> text != null && !text.isBlank())
                .reduce((left, right) -> left + System.lineSeparator() + right)
                .orElse("");
    }

    public byte[] buildSimpleDocument(String fileName, String text) {
        if (!supportsEditableMerge(fileName)) {
            throw new BadRequestException("Editable document merge is not supported for: " + fileName);
        }

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            String normalized = text == null ? "" : text.replaceAll("\\r\\n?", "\n");
            String[] blocks = normalized.split("\\n{2,}", -1);
            for (String block : blocks) {
                XWPFParagraph paragraph = document.createParagraph();
                XWPFRun run = paragraph.createRun();
                run.setText(block == null || block.isBlank() ? " " : block.trim());
            }
            document.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BadRequestException("Failed to build merged DOCX: " + e.getMessage());
        }
    }

    private List<DerivedDocumentIndex.DocumentSegment> extractDocx(byte[] bytes) {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            List<DerivedDocumentIndex.DocumentSegment> segments = new ArrayList<>();
            SegmentOrder order = new SegmentOrder();

            appendBodyElements(segments, safeList(document.getBodyElements()), "body", order);

            int headerIndex = 1;
            for (XWPFHeader header : safeList(document.getHeaderList())) {
                appendBodyElements(segments, safeList(header.getBodyElements()), "header-" + headerIndex++, order);
            }

            int footerIndex = 1;
            for (XWPFFooter footer : safeList(document.getFooterList())) {
                appendBodyElements(segments, safeList(footer.getBodyElements()), "footer-" + footerIndex++, order);
            }

            int footnoteIndex = 1;
            for (XWPFAbstractFootnoteEndnote footnote : safeList(document.getFootnotes())) {
                appendParagraphs(segments, safeList(footnote.getParagraphs()), "footnote-" + footnoteIndex++, order);
            }

            int endnoteIndex = 1;
            for (XWPFAbstractFootnoteEndnote endnote : safeList(document.getEndnotes())) {
                appendParagraphs(segments, safeList(endnote.getParagraphs()), "endnote-" + endnoteIndex++, order);
            }

            int commentIndex = 1;
            XWPFComment[] comments = document.getComments();
            for (XWPFComment comment : comments == null ? new XWPFComment[0] : comments) {
                String text = normalizeText(comment.getText());
                if (!text.isBlank()) {
                    segments.add(buildSegment("comment", text, order.next(), null, "comment-" + commentIndex));
                }
                commentIndex++;
            }

            appendSupplementalXmlSegments(bytes, segments, order);

            return segments;
        } catch (Exception e) {
            throw new BadRequestException("Failed to extract DOCX content: " + e.getMessage());
        }
    }

    private void appendBodyElements(
            List<DerivedDocumentIndex.DocumentSegment> segments,
            List<IBodyElement> elements,
            String location,
            SegmentOrder order
    ) {
        int blockIndex = 1;
        for (IBodyElement element : safeList(elements)) {
            String childLocation = location + "." + blockIndex++;
            if (element instanceof XWPFParagraph paragraph) {
                appendParagraph(segments, paragraph, childLocation, order);
            } else if (element instanceof XWPFTable table) {
                appendTable(segments, table, childLocation, order);
            } else if (element instanceof XWPFSDT sdt) {
                appendTextSegment(
                        segments,
                        "content-control",
                        sdt.getContent() != null ? sdt.getContent().getText() : "",
                        childLocation,
                        order
                );
            }
        }
    }

    private void appendParagraphs(
            List<DerivedDocumentIndex.DocumentSegment> segments,
            List<XWPFParagraph> paragraphs,
            String location,
            SegmentOrder order
    ) {
        int index = 1;
        for (XWPFParagraph paragraph : safeList(paragraphs)) {
            appendParagraph(segments, paragraph, location + "." + index++, order);
        }
    }

    private void appendParagraph(
            List<DerivedDocumentIndex.DocumentSegment> segments,
            XWPFParagraph paragraph,
            String location,
            SegmentOrder order
    ) {
        String text = normalizeText(paragraphText(paragraph));
        if (text.isBlank()) {
            return;
        }
        String style = paragraph.getStyle();
        String kind = style != null && style.toLowerCase().contains("heading")
                ? "heading"
                : "paragraph";
        segments.add(buildSegment(kind, text, order.next(), null, location));
    }

    private void appendTable(
            List<DerivedDocumentIndex.DocumentSegment> segments,
            XWPFTable table,
            String location,
            SegmentOrder order
    ) {
        int rowIndex = 1;
        for (XWPFTableRow row : safeList(table.getRows())) {
            int cellIndex = 1;
            for (XWPFTableCell cell : safeList(row.getTableCells())) {
                String cellLocation = location + ".r" + rowIndex + "c" + cellIndex++;
                appendBodyElements(segments, safeList(cell.getBodyElements()), cellLocation, order);
            }
            rowIndex++;
        }
    }

    private void appendTextSegment(
            List<DerivedDocumentIndex.DocumentSegment> segments,
            String kind,
            String rawText,
            String location,
            SegmentOrder order
    ) {
        String text = normalizeText(rawText);
        if (!text.isBlank()) {
            segments.add(buildSegment(kind, text, order.next(), null, location));
        }
    }

    private String paragraphText(XWPFParagraph paragraph) {
        StringBuilder out = new StringBuilder();
        for (IRunElement element : safeList(paragraph.getIRuns())) {
            if (element instanceof XWPFRun run) {
                appendRunText(out, run);
            } else if (element instanceof XWPFSDT sdt) {
                appendWithSpace(out, sdt.getContent() != null ? sdt.getContent().getText() : "");
            }
        }
        String text = out.toString();
        return text.isBlank() ? paragraph.getText() : text;
    }

    private void appendRunText(StringBuilder out, XWPFRun run) {
        appendWithSpace(out, run.text());
        if (run.getCTR() != null) {
            for (XmlObject drawing : safeList(run.getCTR().getDrawingList())) {
                appendWithSpace(out, xmlText(drawing));
            }
            for (XmlObject pict : safeList(run.getCTR().getPictList())) {
                appendWithSpace(out, xmlText(pict));
            }
        }
    }

    private void appendWithSpace(StringBuilder out, String text) {
        String normalized = normalizeText(text);
        if (normalized.isBlank()) {
            return;
        }
        if (!out.isEmpty()) {
            out.append(' ');
        }
        out.append(normalized);
    }

    private String xmlText(XmlObject xml) {
        if (xml == null) {
            return "";
        }
        try {
            String raw = xml.newCursor().getTextValue();
            return normalizeText(raw);
        } catch (Exception ignored) {
            return "";
        }
    }

    private void appendSupplementalXmlSegments(
            byte[] bytes,
            List<DerivedDocumentIndex.DocumentSegment> segments,
            SegmentOrder order
    ) {
        StringBuilder covered = new StringBuilder();
        for (DerivedDocumentIndex.DocumentSegment segment : segments) {
            appendCoverage(covered, segment.getText());
        }

        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                if (entry.isDirectory() || !isWordXmlPart(name)) {
                    continue;
                }

                String xml = readZipEntryText(zip);
                if (xml.isBlank()) {
                    continue;
                }

                List<String> blocks = extractXmlTextBlocks(xml);
                int blockIndex = 1;
                for (String block : blocks) {
                    String text = normalizeText(block);
                    if (text.isBlank() || isCovered(covered, text)) {
                        blockIndex++;
                        continue;
                    }
                    segments.add(buildSegment(
                            "xml-text",
                            text,
                            order.next(),
                            null,
                            "xml:" + name + "." + blockIndex
                    ));
                    appendCoverage(covered, text);
                    blockIndex++;
                }
            }
        } catch (Exception ignored) {
            // POI extraction already produced the primary blame segments. The XML sweep is best-effort
            // coverage for Word features that POI does not expose consistently.
        }
    }

    private boolean isWordXmlPart(String name) {
        if (name == null || !name.startsWith("word/") || !name.endsWith(".xml")) {
            return false;
        }
        return !name.startsWith("word/_rels/")
                && !name.startsWith("word/theme/")
                && !name.startsWith("word/media/")
                && !name.endsWith(".rels");
    }

    private String readZipEntryText(ZipInputStream zip) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        zip.transferTo(out);
        return out.toString(StandardCharsets.UTF_8);
    }

    private List<String> extractXmlTextBlocks(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);

            Document document = factory
                    .newDocumentBuilder()
                    .parse(new InputSource(new StringReader(xml)));
            List<String> blocks = new ArrayList<>();
            collectXmlBlocks(document.getDocumentElement(), blocks);
            if (blocks.isEmpty()) {
                String text = xmlTextFromNode(document.getDocumentElement());
                if (!text.isBlank()) {
                    blocks.add(text);
                }
            }
            return blocks;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private void collectXmlBlocks(Node node, List<String> blocks) {
        if (node == null) {
            return;
        }

        String local = localName(node);
        if (isXmlTextBlock(local)) {
            String text = xmlTextFromNode(node);
            if (!text.isBlank()) {
                blocks.add(text);
            }
            return;
        }

        NodeList children = node.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            collectXmlBlocks(children.item(i), blocks);
        }
    }

    private boolean isXmlTextBlock(String localName) {
        return "p".equals(localName)
                || "txbxContent".equals(localName)
                || "sdtContent".equals(localName)
                || "comment".equals(localName)
                || "footnote".equals(localName)
                || "endnote".equals(localName)
                || "title".equals(localName);
    }

    private String xmlTextFromNode(Node node) {
        StringBuilder out = new StringBuilder();
        collectXmlText(node, out);
        return normalizeText(out.toString());
    }

    private void collectXmlText(Node node, StringBuilder out) {
        if (node == null) {
            return;
        }

        String local = localName(node);
        if (isXmlTextNode(local)) {
            appendWithSpace(out, node.getTextContent());
            return;
        }

        NodeList children = node.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            collectXmlText(children.item(i), out);
        }
    }

    private boolean isXmlTextNode(String localName) {
        return "t".equals(localName)
                || "instrText".equals(localName)
                || "delText".equals(localName);
    }

    private String localName(Node node) {
        String local = node.getLocalName();
        if (local != null && !local.isBlank()) {
            return local;
        }
        String name = node.getNodeName();
        int idx = name == null ? -1 : name.indexOf(':');
        return idx >= 0 ? name.substring(idx + 1) : name == null ? "" : name;
    }

    private void appendCoverage(StringBuilder covered, String text) {
        String normalized = compactText(text);
        if (normalized.isBlank()) {
            return;
        }
        if (!covered.isEmpty()) {
            covered.append(' ');
        }
        covered.append(normalized);
    }

    private boolean isCovered(StringBuilder covered, String text) {
        String normalized = compactText(text);
        return normalized.isBlank() || covered.indexOf(normalized) >= 0;
    }

    private String compactText(String value) {
        return normalizeText(value)
                .toLowerCase()
                .replaceAll("\\s+", " ");
    }

    private List<DerivedDocumentIndex.DocumentSegment> extractPdf(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            List<DerivedDocumentIndex.DocumentSegment> segments = new ArrayList<>();
            PDFTextStripper stripper = new PDFTextStripper();
            int order = 0;

            for (int page = 1; page <= document.getNumberOfPages(); page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String pageText = normalizeText(stripper.getText(document));
                if (pageText.isBlank()) {
                    continue;
                }

                String[] blocks = BLANK_BLOCK.split(pageText);
                for (String block : blocks) {
                    String text = normalizeText(block);
                    if (text.isBlank()) {
                        continue;
                    }
                    segments.add(buildSegment("text-block", text, order++, page));
                }
            }

            return segments;
        } catch (Exception e) {
            throw new BadRequestException("Failed to extract PDF content: " + e.getMessage());
        }
    }

    private DerivedDocumentIndex.DocumentSegment buildSegment(
            String kind,
            String text,
            int order,
            Integer page,
            String location
    ) {
        String normalized = normalizeText(text);
        return DerivedDocumentIndex.DocumentSegment.builder()
                .id(UUID.randomUUID().toString())
                .kind(kind)
                .text(normalized)
                .stableHash(stableHash(kind + "\n" + normalizeLocation(location) + "\n" + normalized))
                .page(page)
                .orderIndex(order)
                .location(normalizeLocation(location))
                .build();
    }

    private DerivedDocumentIndex.DocumentSegment buildSegment(
            String kind,
            String text,
            int order,
            Integer page
    ) {
        return buildSegment(kind, text, order, page, null);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace('\u00A0', ' ')
                .replaceAll("\\r\\n?", "\n")
                .replaceAll("[\\t ]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private String stableHash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to hash document segment", e);
        }
    }

    private String normalizeLocation(String value) {
        return value == null ? "" : value.trim();
    }

    private <T> List<T> safeList(List<T> values) {
        return values == null ? Collections.emptyList() : values;
    }

    private String normalizedExtension(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return "";
        }
        String name = filePath.trim();
        int idx = name.lastIndexOf('.');
        if (idx < 0 || idx + 1 >= name.length()) {
            return "";
        }
        return name.substring(idx + 1).toLowerCase();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractionResult {
        private String fileType;
        private List<DerivedDocumentIndex.DocumentSegment> segments;
    }

    private static class SegmentOrder {
        private int value = 0;

        private int next() {
            return value++;
        }
    }
}

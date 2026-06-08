package com.final_project.versioncontrolservice.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.InflaterInputStream;

public final class VicObjectFormat {

    private VicObjectFormat() {}

    public record ParsedObject(String type, byte[] content) {}

    public static byte[] zlibInflate(byte[] compressed) throws IOException {
        try (InflaterInputStream zin = new InflaterInputStream(new ByteArrayInputStream(compressed))) {
            return zin.readAllBytes();
        }
    }

    public static ParsedObject parseInflated(byte[] raw) {
        int z = indexOfZero(raw);
        if (z < 0) {
            throw new IllegalArgumentException("invalid object: missing header separator");
        }
        byte[] header = new byte[z];
        System.arraycopy(raw, 0, header, 0, z);
        byte[] content = new byte[raw.length - z - 1];
        System.arraycopy(raw, z + 1, content, 0, content.length);

        String headerStr = new String(header, java.nio.charset.StandardCharsets.UTF_8);
        int sp = headerStr.indexOf(' ');
        if (sp < 0) {
            throw new IllegalArgumentException("invalid object header");
        }
        String type = headerStr.substring(0, sp);
        return new ParsedObject(type, content);
    }

    public static ParsedObject parseCompressed(byte[] compressed) throws IOException {
        return parseInflated(zlibInflate(compressed));
    }

    private static int indexOfZero(byte[] raw) {
        for (int i = 0; i < raw.length; i++) {
            if (raw[i] == 0) {
                return i;
            }
        }
        return -1;
    }

    public static String headerValue(String commitText, String key) {
        List<String> values = headerValues(commitText, key);
        return values.isEmpty() ? "" : values.get(0);
    }

    public static List<String> headerValues(String commitText, String key) {
        String prefix = key + " ";
        List<String> out = new ArrayList<>();
        for (String ln : commitText.split("\n", -1)) {
            if (ln.isBlank()) {
                break;
            }
            if (ln.startsWith(prefix)) {
                out.add(ln.substring(prefix.length()).trim());
            }
        }
        return out;
    }

    public static CommitData parseCommitContent(byte[] content) {
        String text = new String(content, java.nio.charset.StandardCharsets.UTF_8);
        String tree = headerValue(text, "tree");
        List<String> parents = headerValues(text, "parent");
        return new CommitData(tree, parents);
    }

    public record CommitData(String tree, List<String> parents) {}
}

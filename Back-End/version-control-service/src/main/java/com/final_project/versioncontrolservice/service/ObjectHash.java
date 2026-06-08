package com.final_project.versioncontrolservice.service;

public final class ObjectHash {
    private ObjectHash() {}

    public static boolean isValidSha1Hex(String hash) {
        if (hash == null || hash.length() != 40) {
            return false;
        }
        for (int i = 0; i < 40; i++) {
            char c = hash.charAt(i);
            if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) {
                return false;
            }
        }
        return true;
    }
}

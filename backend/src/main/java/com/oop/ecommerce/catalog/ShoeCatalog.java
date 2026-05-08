package com.oop.ecommerce.catalog;

/**
 * EU shoe sizes offered by the storefront (inventory, checkout validation, admin forms).
 */
public final class ShoeCatalog {

    public static final int MIN_EU_SHOE_SIZE = 36;
    public static final int MAX_EU_SHOE_SIZE = 42;

    private ShoeCatalog() {}

    public static boolean isAllowedSize(int size) {
        return size >= MIN_EU_SHOE_SIZE && size <= MAX_EU_SHOE_SIZE;
    }
}

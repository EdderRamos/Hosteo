package com.edlabcode.hosteo.exception;

public class DuplicateDocumentException extends RuntimeException {
    public DuplicateDocumentException() {
        super("An account with this document already exists");
    }
}

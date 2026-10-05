package com.edlabcode.hosteo.exception;

public class ProfileConflictException extends RuntimeException {
    public ProfileConflictException() {
        super("Your profile has changed. Reload it before saving again");
    }
}

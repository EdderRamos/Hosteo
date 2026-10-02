package com.edlabcode.hosteo.dto;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserResponse user) {
}

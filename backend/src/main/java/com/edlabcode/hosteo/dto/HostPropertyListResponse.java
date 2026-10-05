package com.edlabcode.hosteo.dto;

import java.util.List;

public record HostPropertyListResponse(List<PropertyResponse> items, long total, int page, int pages) {}

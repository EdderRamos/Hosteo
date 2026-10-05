package com.edlabcode.hosteo.dto;

import com.edlabcode.hosteo.entity.Property;

public record PendingPropertyResponse(PropertyResponse property, Host host) {
    public record Host(Long id, String firstName, String lastName, String email) {}
    public static PendingPropertyResponse from(Property property) {
        var host = property.getHost();
        return new PendingPropertyResponse(PropertyResponse.from(property),
                new Host(host.getId(), host.getFirstName(), host.getLastName(), host.getEmail()));
    }
}

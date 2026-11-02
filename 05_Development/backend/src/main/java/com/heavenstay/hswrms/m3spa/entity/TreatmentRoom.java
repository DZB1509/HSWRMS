package com.heavenstay.hswrms.m3spa.entity;

import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "TreatmentRoom", schema = "dbo")
public class TreatmentRoom {

    public static final String AVAILABLE = "AVAILABLE";
    public static final String OCCUPIED = "OCCUPIED";
    public static final String MAINTENANCE = "MAINTENANCE";
    public static final String INACTIVE = "INACTIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Integer roomId;

    @Column(name = "room_name", nullable = false, length = 100, unique = true)
    private String roomName;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_status", nullable = false, length = 20)
    private TreatmentRoomStatus roomStatus = TreatmentRoomStatus.AVAILABLE;

    public TreatmentRoom() {
    }

    public TreatmentRoom(String roomName, TreatmentRoomStatus roomStatus) {
        this.roomName = roomName;
        this.roomStatus = roomStatus != null ? roomStatus : TreatmentRoomStatus.AVAILABLE;
    }

    public TreatmentRoom(String roomName, TreatmentRoomStatus roomStatus, String roomType) {
        this.roomName = roomName;
        this.roomStatus = roomStatus != null ? roomStatus : TreatmentRoomStatus.AVAILABLE;
        this.roomType = roomType;
    }

    public TreatmentRoom(String roomName, String roomType, String roomStatus) {
        this.roomName = roomName;
        this.roomType = roomType;
        if (roomStatus != null) {
            try {
                this.roomStatus = TreatmentRoomStatus.valueOf(roomStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                this.roomStatus = TreatmentRoomStatus.AVAILABLE;
            }
        } else {
            this.roomStatus = TreatmentRoomStatus.AVAILABLE;
        }
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public TreatmentRoomStatus getRoomStatus() {
        return roomStatus;
    }

    public void setRoomStatus(TreatmentRoomStatus roomStatus) {
        this.roomStatus = roomStatus;
    }

    public void setRoomStatus(String roomStatus) {
        if (roomStatus != null) {
            try {
                this.roomStatus = TreatmentRoomStatus.valueOf(roomStatus.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                this.roomStatus = TreatmentRoomStatus.AVAILABLE;
            }
        }
    }
}

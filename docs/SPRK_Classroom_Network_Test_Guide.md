# SPRK Classroom Network Test Guide
This guide explains how to test a classroom setup where one laptop hosts a backend and students join from Chromebooks, iPads, iPhones, Android phones, or other laptops.

The goal is to prove this pattern before class:

```text
Backend host laptop
  |
  v
Classroom network
  |
  v
Student devices open the app in a browser
```

## Table Of Contents
- [Recommended Device Roles](#recommended-device-roles)
- [Network Options](#network-options)
- [Option D - Cursor Cloud Facilitator With Public Tunnel](#option-d---cursor-cloud-facilitator-with-public-tunnel)
- [TCL LINKPORT IK511 Note](#tcl-linkport-ik511-note)
- [Test Accounts](#test-accounts)
- [Four Device Test](#four-device-test)
- [Backend Host Requirements](#backend-host-requirements)
- [Student Device Requirements](#student-device-requirements)
- [Classroom Fallbacks](#classroom-fallbacks)
- [Alpha Student Validation](#alpha-student-validation)

## Recommended Device Roles
Use a real laptop as the backend host.

Recommended backend host:

- Windows laptop, macOS laptop, or Linux laptop.
- Can run Python or Node.
- Can connect to school Wi-Fi or a private hotspot network.
- Can allow inbound browser connections through the local firewall.

Good backend-host example:

```text
Dell Latitude laptop
```

Student devices can be lighter:

- School Chromebook
- iPad
- iPhone
- Android phone
- Android tablet
- Another laptop

Student devices only need a browser for the first multiplayer classroom tests.

## Network Options
Try networks in this order.

### Option A - School Network
Use the normal school Wi-Fi first.

This is best if it works because students are already allowed to use it.

Possible blocker:

Some school networks use device isolation. That means a student Chromebook may have internet access but cannot connect to a backend running on the teacher laptop.

### Option B - SPRK Laptop Network
The `SPRK Laptop Network` is a private classroom network started from the backend-host laptop.

Use this when the school network blocks device-to-device traffic.

Example pattern:

```text
TCL LINKPORT gives internet to the backend laptop.
Backend laptop shares a local hotspot network.
Student devices join that shared laptop network.
Student devices open the backend laptop IP address in a browser.
```

This keeps the classroom test isolated from school network restrictions where possible.

### Option C - Projector And Pairing
If networking fails, use one visible laptop/projector and assign active roles:

- Driver: controls the code.
- Navigator: reads instructions and decides next move.
- Tester: tries the app and reports behavior.
- Designer: chooses names, colors, rules, or questions.
- Scorekeeper: tracks scores or team results.

No student should become passive because they lack a device.

### Option D - Cursor Cloud Facilitator With Public Tunnel

Use this when the backend runs in **Cursor Cloud** (or another remote Linux workspace) and students join from **any network** with phones, Chromebooks, or tablets.

Students open one shared **HTTPS tunnel URL** (for example from Cloudflare Quick Tunnel), not a laptop LAN address.

Full steps, Cloudflare vs LocalTunnel, bit.ly shortcuts, and troubleshooting:

- [SPRK Cloud Facilitator Hosting Guide](SPRK_Cloud_Facilitator_Hosting_Guide.md)

Quick summary for facilitators:

1. Start `python3 server.py` in the mission folder and leave it running.
2. Start a public tunnel to that port (Cloudflare recommended).
3. Share the `https://....trycloudflare.com` link (or a bit.ly that points to it) with the class.

## TCL LINKPORT IK511 Note
The TCL LINKPORT IK511 is a USB-C cellular internet device. Treat it as internet for one host device, not as a normal multi-device classroom hotspot by itself.

Expected use:

```text
TCL LINKPORT IK511
  -> Dell laptop
  -> Windows Mobile Hotspot or laptop-shared network
  -> student devices
```

What must be tested:

- Whether the Dell laptop can share the LINKPORT connection.
- How many devices can join the laptop-shared network.
- Whether joined devices can open the backend laptop IP address.
- Whether the Windows firewall allows the classroom app port.

Do not assume the LINKPORT alone supports a full classroom of direct Wi-Fi clients.

## Test Accounts
Use different accounts to simulate real classroom roles.

Example test setup:

```text
Dell laptop: AgentDraven
iPad: Mr-PI-Bala
iPhone: Maya-SPRK
School Chromebook: balataps
```

Use generalized account wording in docs:

```text
Backend host: <SPRKAdmin-or-SPRKTeacher-account>
Student device: <YourName>-SPRK or another student test account
```

## Four Device Test
Run this test before using the setup with students.

### Step 1 - Connect Devices
Connect all devices to the same network:

- School Wi-Fi, or
- SPRK Laptop Network

### Step 2 - Start Backend
On the backend-host laptop, start the app so it listens on all network interfaces.

Example:

```bash
python server.py --host 0.0.0.0 --port 8000
```

The important part is:

```text
0.0.0.0
```

That means other devices can connect. `localhost` only works on the same machine.

### Step 3 - Find Host IP
On Windows PowerShell:

```powershell
ipconfig
```

Find the IPv4 address for the active network.

Example:

```text
192.168.137.1
```

### Step 4 - Open From Student Devices
On each student device browser:

```text
http://<backend-host-ip>:8000
```

Example:

```text
http://192.168.137.1:8000
```

### Step 5 - Validate Interaction
Each device should be able to:

- Load the page.
- Enter a player name.
- Send an action.
- See shared score, game state, or leaderboard changes.

## Backend Host Requirements
The backend host must:

- Run the backend app.
- Bind to `0.0.0.0`.
- Show its local IP address.
- Allow the app port through firewall.
- Stay awake during class.
- Stay plugged into power if possible.

For Windows Firewall, allow Python or Node when prompted for a private network.

## Student Device Requirements
Student devices need:

- Browser access.
- Same network as the backend host.
- The backend URL.

They do not need GitHub access for the first multiplayer test.

They do not need Codespaces for the first multiplayer test.

They do not need a personal laptop if they can use:

- school Chromebook
- shared iPad
- personal phone
- paired teammate device

## Classroom Fallbacks
Use this order:

```text
School Wi-Fi
  |
  v
SPRK Laptop Network
  |
  v
Cursor Cloud + public tunnel (any device, any network)
  |
  v
Projector/shared laptop mode
  |
  v
Paper roles plus live demo
```

If device networking fails, still run the collaboration:

- Students propose game rules.
- Students choose team names.
- Students test the projected app.
- Students report bugs.
- Students design the next feature.

## Alpha Student Validation
Maya.SPRK should validate this guide as the Alpha Student.

Maya checks:

- Can a student understand the device roles?
- Can a student tell the difference between school Wi-Fi and SPRK Laptop Network?
- Can a student open the backend URL from a phone?
- Can a student understand why `localhost` is wrong on their own phone?
- Can a student participate without GitHub access?
- Can a student participate without a personal laptop?

When Maya finds confusion, capture it as:

1. A GitHub issue or issue comment.
2. A `Formative Insights` entry in `docs/PROJECT_GUIDE.md` if it changes how SPRK should teach or operate.
3. A user-facing guide update if it changes what students need to do.

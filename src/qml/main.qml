import QtQuick 2.15
import "calc.js" as Calc

// Calculator for reMarkable (AppLoad). High contrast, no animations: e-ink friendly.
Rectangle {
    id: root
    color: "white"

    // Required by AppLoad on the root item
    signal close
    function unloading() { }

    property var st: Calc.initialState()
    property var view: Calc.view(st)

    readonly property real pad: width * 0.04
    readonly property real gap: width * 0.025
    readonly property real keyW: (width - 2 * pad - 3 * gap) / 4
    readonly property real border: Math.max(2, width * 0.003)

    // Close button
    Rectangle {
        id: closeBtn
        anchors { top: parent.top; right: parent.right; margins: root.pad }
        width: root.keyW * 1.2
        height: root.height * 0.04
        color: closeMa.pressed ? "black" : "white"
        border { color: "black"; width: root.border }
        radius: 8
        Text {
            anchors.centerIn: parent
            text: "Close"
            font.pixelSize: parent.height * 0.5
            color: closeMa.pressed ? "white" : "black"
        }
        MouseArea { id: closeMa; anchors.fill: parent; onClicked: root.close() }
    }

    // Display
    Item {
        id: display
        x: root.pad
        y: closeBtn.y + closeBtn.height + root.gap
        width: root.width - 2 * root.pad
        height: root.height * 0.2

        Text {
            id: topLine
            anchors { left: parent.left; right: parent.right; top: parent.top }
            height: parent.height * 0.3
            text: root.view.top
            horizontalAlignment: Text.AlignRight
            verticalAlignment: Text.AlignVCenter
            font.pixelSize: height * 0.7
            fontSizeMode: Text.Fit
            minimumPixelSize: 16
            color: "#444"
        }
        Text {
            anchors { left: parent.left; right: parent.right; top: topLine.bottom; bottom: parent.bottom }
            text: root.view.main
            horizontalAlignment: Text.AlignRight
            verticalAlignment: Text.AlignVCenter
            font.pixelSize: height * 0.8
            fontSizeMode: Text.Fit
            minimumPixelSize: 20
            color: "black"
        }
        Rectangle { anchors.bottom: parent.bottom; width: parent.width; height: root.border; color: "black" }
    }

    // Keypad
    Column {
        id: keypad
        x: root.pad
        y: display.y + display.height + root.gap
        spacing: root.gap
        readonly property real rowH: (root.height - y - root.pad - 5 * root.gap) / 6

        Repeater {
            model: Calc.LAYOUT
            delegate: Row {
                spacing: root.gap
                property var rowKeys: modelData
                Repeater {
                    model: rowKeys
                    delegate: Rectangle {
                        property string key: modelData.k
                        property bool inverted: Calc.isAccent(key) !== ma.pressed
                        width: root.keyW * modelData.s + root.gap * (modelData.s - 1)
                        height: keypad.rowH
                        radius: 12
                        color: inverted ? "black" : "white"
                        border { color: "black"; width: root.border }
                        Text {
                            anchors.centerIn: parent
                            text: key
                            font.pixelSize: key === "DEL" ? parent.height * 0.3 : parent.height * 0.42
                            color: parent.inverted ? "white" : "black"
                        }
                        MouseArea {
                            id: ma
                            anchors.fill: parent
                            onClicked: root.st = Calc.press(root.st, key)
                        }
                    }
                }
            }
        }
    }
}

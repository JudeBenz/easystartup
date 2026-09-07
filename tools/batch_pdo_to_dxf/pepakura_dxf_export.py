# SPDX-License-Identifier: MIT
"""
Automate Pepakura Designer: open each .pdo and export Vector Format → DXF.

Requires: Windows + Pepakura Designer + Python packages:
  pip install pyautogui pywinauto pygetwindow pyperclip

DXF (not DFX) is the Autodesk format LightBurn imports.
"""

from __future__ import annotations

import subprocess
import time
from pathlib import Path


def _sleep(s: float) -> None:
    time.sleep(s)


def export_pdo_to_dxf(
    pepakura_exe: Path,
    pdo: Path,
    dxf: Path,
    *,
    open_wait: float = 4.0,
    dialog_wait: float = 1.2,
    after_save_wait: float = 1.5,
) -> None:
    """
    Drive Pepakura UI for one file.

    Assumed English Pepakura Designer menu:
      File → Export → Vector Format… → choose DXF → Save
    Key sequence (Alt menus):
      Alt+F, X, V   then save dialog gets the path via clipboard+Ctrl+V
    """
    import pyautogui
    import pyperclip

    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.15

    dxf.parent.mkdir(parents=True, exist_ok=True)
    if dxf.exists():
        dxf.unlink()

    # Open this PDO in Pepakura (reuses/starts app depending on OS association)
    subprocess.Popen([str(pepakura_exe), str(pdo)], shell=False)
    _sleep(open_wait)

    # Focus Pepakura if possible
    try:
        import pygetwindow as gw

        titles = [
            w
            for w in gw.getAllTitles()
            if w and ("pepakura" in w.lower() or "designer" in w.lower())
        ]
        if titles:
            wins = gw.getWindowsWithTitle(titles[0])
            if wins:
                win = wins[0]
                if win.isMinimized:
                    win.restore()
                win.activate()
                _sleep(0.5)
    except Exception:
        pass

    # File → Export → Vector Format
    # Pepakura English: File(F) → Export → Vector Format
    pyautogui.hotkey("alt", "f")
    _sleep(0.4)
    # Walk Export: press X (Export) — if that fails users can remapped in UI later
    pyautogui.press("x")
    _sleep(0.35)
    pyautogui.press("v")
    _sleep(dialog_wait)

    # Some Pepakura versions open a format picker first (DXF/EPS/EMF).
    # Try selecting DXF by typing "dxf" / Down arrows, then Enter.
    pyautogui.typewrite("dxf")
    _sleep(0.25)
    pyautogui.press("enter")
    _sleep(dialog_wait)

    # Save dialog: paste full path
    pyperclip.copy(str(dxf))
    pyautogui.hotkey("ctrl", "v")
    _sleep(0.3)
    pyautogui.press("enter")
    _sleep(0.4)
    # If overwrite prompt
    pyautogui.press("y")
    _sleep(after_save_wait)

    # Close current document so next open is clean (Ctrl+F4 or Ctrl+W)
    pyautogui.hotkey("ctrl", "w")
    _sleep(0.4)
    # Discard unsaved changes if prompted
    pyautogui.press("n")
    _sleep(0.5)


def try_pywinauto_export(
    pepakura_exe: Path,
    pdo: Path,
    dxf: Path,
    open_wait: float = 4.0,
) -> bool:
    """Prefer UI Automation menus when available. Returns True on success."""
    try:
        from pywinauto import Application
        from pywinauto.findwindows import ElementNotFoundError
    except ImportError:
        return False

    import pyperclip

    dxf.parent.mkdir(parents=True, exist_ok=True)
    subprocess.Popen([str(pepakura_exe), str(pdo)], shell=False)
    time.sleep(open_wait)

    try:
        app = Application(backend="uia").connect(path=str(pepakura_exe), timeout=20)
    except Exception:
        try:
            app = Application(backend="uia").connect(
                title_re=".*Pepakura.*", timeout=20
            )
        except Exception:
            return False

    try:
        win = app.top_window()
        win.set_focus()
        # Try a few menu path variants across Pepakura versions
        for path in (
            "File->Export->Vector Format...",
            "File->Export->Vector Format",
            "File->Export->DXF...",
            "ファイル(&F)->エクスポート->ベクター形式...",
        ):
            try:
                win.menu_select(path)
                break
            except Exception:
                continue
        else:
            return False

        time.sleep(1.0)
        # Save As dialog
        try:
            dlg = app.window(title_re=".*(Save|Export|保存).*")
            dlg.set_focus()
            edit = dlg.child_window(control_type="Edit")
            edit.set_edit_text(str(dxf))
            dlg.child_window(title_re=".*(Save|OK|保存).*", control_type="Button").click()
        except ElementNotFoundError:
            pyperclip.copy(str(dxf))
            import pyautogui

            pyautogui.hotkey("ctrl", "v")
            pyautogui.press("enter")

        time.sleep(1.2)
        try:
            win.type_keys("^w")
            time.sleep(0.3)
            win.type_keys("n")
        except Exception:
            pass
        return dxf.exists()
    except Exception:
        return False

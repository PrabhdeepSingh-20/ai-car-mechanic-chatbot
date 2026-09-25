def diagnose_car(message):
    text = message.lower()

    if any(word in text for word in ["battery", "dead battery", "weak battery"]):
        return {
            "problem": "Possible battery problem",
            "possible_cause": (
                "The battery may be weak, discharged, or unable to provide "
                "enough power to start the vehicle."
            ),
            "recommendation": (
                "Check the battery terminals and battery voltage. "
                "If the battery is discharged, try charging or jump-starting it. "
                "If the battery is old or repeatedly losing charge, have it tested."
            ),
        }

    if (
        ("won't start" in text or "wont start" in text or "doesn't start" in text)
        and ("crank" in text or "cranking" in text)
    ):
        return {
            "problem": "Engine cranks but does not start",
            "possible_cause": (
                "The issue may involve fuel delivery, ignition, or the engine "
                "management system."
            ),
            "recommendation": (
                "Check whether there is sufficient fuel and look for warning "
                "lights on the dashboard. Further diagnosis may be required."
            ),
        }

    if "overheat" in text or "overheating" in text:
        return {
            "problem": "Engine overheating",
            "possible_cause": (
                "Possible causes include low coolant, a cooling-system problem, "
                "a faulty thermostat, radiator issue, or cooling fan problem."
            ),
            "recommendation": (
                "Stop driving if the temperature is dangerously high. "
                "Allow the engine to cool and check the coolant level. "
                "Do not open the coolant reservoir while the engine is hot."
            ),
        }

    if "brake" in text and any(
        word in text for word in ["noise", "squeak", "squeaking", "grinding"]
    ):
        return {
            "problem": "Possible brake noise",
            "possible_cause": (
                "Brake noise can be caused by worn brake pads, brake dust, "
                "or other brake-component issues."
            ),
            "recommendation": (
                "Have the brake system inspected, especially if the noise "
                "is accompanied by reduced braking performance."
            ),
        }

    return None
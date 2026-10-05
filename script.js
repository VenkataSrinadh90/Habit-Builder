document.addEventListener("DOMContentLoaded", () => {

    const registrationForm = document.querySelector(".register-form");
    const passwordInput = document.querySelector("#register-password");
    const confirmationInput = document.querySelector("#confirm-password");

    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.passwordToggle);

            if (!input) {
                return;
            }

            const isVisible = input.type === "text";
            input.type = isVisible ? "password" : "text";
            button.textContent = isVisible ? "Show" : "Hide";
            button.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password`);
            button.setAttribute("aria-pressed", String(!isVisible));
        });
    });

    if (registrationForm && passwordInput && confirmationInput) {
        const strengthFill = registrationForm.querySelector("[data-strength-fill]");
        const strengthLabel = registrationForm.querySelector("#password-strength");
        const matchFeedback = registrationForm.querySelector("#confirm-feedback");

        const updatePasswordFeedback = () => {
            const password = passwordInput.value;
            const checks = [
                password.length >= 8,
                /[a-z]/.test(password) && /[A-Z]/.test(password),
                /\d/.test(password),
                /[^A-Za-z0-9]/.test(password)
            ];
            const score = password ? checks.filter(Boolean).length : 0;
            const strengths = ["", "A little more variety will help.", "Getting there.", "Looking good.", "Strong password."];

            strengthFill.style.width = `${score * 25}%`;
            strengthFill.style.backgroundColor = score < 2 ? "#c96a55" : score < 4 ? "#d4a44e" : "#63a27f";
            strengthLabel.textContent = strengths[score];

            const passwordsMatch = !confirmationInput.value || password === confirmationInput.value;
            confirmationInput.setCustomValidity(passwordsMatch ? "" : "Passwords do not match.");
            matchFeedback.textContent = confirmationInput.value
                ? passwordsMatch ? "Passwords match." : "Passwords do not match."
                : "";
            matchFeedback.classList.toggle("is-mismatch", Boolean(confirmationInput.value) && !passwordsMatch);
        };

        passwordInput.addEventListener("input", updatePasswordFeedback);
        confirmationInput.addEventListener("input", updatePasswordFeedback);
    }

    document.querySelectorAll("[data-demo-form]").forEach((form) => {
        form.addEventListener("input", () => {
            const message = form.querySelector(".form-message");
            if (message) {
                message.textContent = "";
            }
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const message = form.querySelector(".form-message");
            if (message) {
                message.textContent = "Your details look good. Account services are not connected in this demo yet.";
            }
        });
    });

    /* =================================
       SCROLL REVEAL
    ================================= */

    const revealElements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
        (entries, observer) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        }
    );


    revealElements.forEach((element) => {
        observer.observe(element);
    });


    /* =================================
       SMOOTH ANCHOR SCROLLING
    ================================= */

    document.querySelectorAll('a[href^="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId = link.getAttribute("href");

            if (
                targetId === "#" ||
                !targetId
            ) {
                return;
            }

            const target = document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });

});
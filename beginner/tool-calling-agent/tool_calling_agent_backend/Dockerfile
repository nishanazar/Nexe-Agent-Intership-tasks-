# Use a lightweight Python image with uv pre-installed
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set the working directory
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy only the files needed for installing dependencies
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# This creates a virtual environment in /main/.venv
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application code
COPY . .

# Install the project itself
RUN uv sync --frozen --no-dev

# Hugging Face Spaces run as user 1000 by default for security
RUN useradd -m -u 1000 user
USER user

# Ensure the virtual environment's binaries are in the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port Hugging Face expects
EXPOSE 7860

# Run the application
# We use 0.0.0.0 to allow external access and port 7860 as required by Hugging Face
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

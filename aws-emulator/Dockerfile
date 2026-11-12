FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal

ARG TARGETARCH
ARG EMULATOR_RELEASE=latest
RUN microdnf install -y curl-minimal \
    && case "$TARGETARCH" in \
         arm64) package_arch=aarch64 ;; \
         amd64) package_arch=x86_64 ;; \
         *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
       esac \
    && curl --fail --location --retry 3 \
       "https://downloads.aws.com/aws-emulator/packages/aws-emulator/LTS/${EMULATOR_RELEASE}/aws-emulator-${package_arch}.rpm" \
       --output /tmp/aws-emulator.rpm \
    && rpm -i /tmp/aws-emulator.rpm \
    && rm /tmp/aws-emulator.rpm \
    && microdnf clean all \
    && mkdir -p /home/emulator/.aws/emulator \
    && chown -R 1000:1000 /home/emulator

USER 1000:1000
ENV HOME=/home/emulator
EXPOSE 9297
ENTRYPOINT ["aws-emulator", "--bind", "0.0.0.0", "--auth", "on", "--telemetry", "off"]

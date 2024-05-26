import React from "react";
import { Formik, Form, Field, ErrorMessage, FormikProps } from "formik";
import Button from "@/components/common/Button";
import { Select, DatePicker } from "antd";
import * as Yup from "yup";
import { useProposal } from "@/ContextProviders/ProposalProvider";
import { enqueueSnackbar } from "notistack";

interface FormMessage {
  title: string;
  description: string;
  priceperNFT: number;
  funding_goal: number;
  stable_coin_option: string;
  starting_date: string;
  ending_date: string;
}

const ConvertModal = () => {
  const { proposal } = useProposal();

  const initialValues: FormMessage = proposal
    ? {
        title: proposal.title,
        description: proposal.description,
        priceperNFT: proposal.priceperNFT,
        funding_goal: proposal.funding_goal,
        stable_coin_option: "SUI",
        starting_date: "",
        ending_date: "",
      }
    : {
        title: "",
        description: "",
        priceperNFT: 0,
        funding_goal: 0,
        stable_coin_option: "",
        starting_date: "",
        ending_date: "",
      };

  const validationSchema = Yup.object().shape({
    stable_coin_option: Yup.string().required("Required"),
    starting_date: Yup.string().required("Required"),
    ending_date: Yup.string().required("Required"),
  });

  return (
    <div>
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={(values, actions) => {
          enqueueSnackbar(`Proposal Converted`, {
            variant: "success",
          });
          actions.setSubmitting(false);
        }}
      >
        {({
          values,
          isSubmitting,
          setFieldValue,
          errors,
        }: FormikProps<FormMessage>) => (
          <Form>
            <div className="">
              <div className="w-[500px]  text-sm  px-4 py-4 flex flex-col gap-4">
                <div className="text-lg font-medium ">{values.title}</div>
                <div>{values.description}</div>
                <div>Price Per NFT: {values.priceperNFT}</div>
                <div>
                  Funding Goal: {values.funding_goal}{" "}
                  {values.stable_coin_option}
                </div>
                <div>
                  <label htmlFor="stable_coin_option" className="block mb-2">
                    StableCoin for the funding :
                  </label>
                  <Select
                    aria-required
                    defaultValue={values.stable_coin_option}
                    className="w-full"
                    onChange={(e) => {
                      setFieldValue("stable_coin_option", e);
                    }}
                    options={[
                      { value: "USDT", label: "USDT" },
                      { value: "USDC", label: "USDC" },
                      { value: "SUI", label: "SUI" },
                    ]}
                  />
                </div>
                <div className="flex gap-6 items-center">
                  <div>
                    <label htmlFor="starting_date" className="block mb-2">
                      Starting Date
                    </label>
                    <DatePicker
                      onChange={(e) => {
                        setFieldValue("starting_date", e);
                      }}
                    />
                    <div className="text-red-500 text-xs mt-1">
                      <ErrorMessage name="ending_date" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ending_date" className="block mb-2">
                      Ending Date
                    </label>
                    <DatePicker
                      onChange={(e) => {
                        setFieldValue("ending_date", e);
                      }}
                    />
                    <div className="text-red-500 text-xs mt-1">
                      <ErrorMessage name="ending_date" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-2">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    className="flex justify-center"
                    _isSubmitting={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Launch crowdfunding
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ConvertModal;
